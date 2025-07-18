
import cron from 'node-cron';
import clientPromise from './mongodb.js';

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
    this.init();
  }

  async init() {
    try {
      await this.createJobCacheTable();
      await this.loadJobsFromDatabase();
      this.startCronJobs();
      this.isInitialized = true;
      console.log('Job queue initialized successfully');
    } catch (error) {
      console.error('Error initializing job queue:', error);
    }
  }

  async createJobCacheTable() {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      
      // Create job_cache collection if it doesn't exist
      const collections = await db.listCollections({ name: 'job_cache' }).toArray();
      if (collections.length === 0) {
        await db.createCollection('job_cache');
        console.log('Created job_cache collection');
      }

      // Create index for efficient querying
      await db.collection('job_cache').createIndex({ scheduledFor: 1 });
    } catch (error) {
      console.error('Error creating job cache table:', error);
      throw error;
    }
  }

  async loadJobsFromDatabase() {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const collection = db.collection('job_cache');

      const jobs = await collection.find({}).toArray();
      const now = new Date();
      const expiredJobs = [];

      for (const job of jobs) {
        this.jobs.set(job.jobId, {
          type: job.type,
          keysystemId: job.keysystemId,
          sessionId: job.sessionId,
          keyValue: job.keyValue,
          scheduledFor: new Date(job.scheduledFor)
        });

        // Check if job should have already run
        if (new Date(job.scheduledFor) <= now) {
          expiredJobs.push(job);
        }
      }

      // Execute expired jobs immediately
      if (expiredJobs.length > 0) {
        console.log(`Found ${expiredJobs.length} expired jobs, executing immediately...`);
        for (const job of expiredJobs) {
          await this.executeJob(job);
        }
      }

      console.log(`Loaded ${jobs.length} jobs from database`);
    } catch (error) {
      console.error('Error loading jobs from database:', error);
      throw error;
    }
  }

  async saveJobToDatabase(jobId, jobData) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const collection = db.collection('job_cache');

      await collection.insertOne({
        jobId,
        type: jobData.type,
        keysystemId: jobData.keysystemId,
        sessionId: jobData.sessionId,
        keyValue: jobData.keyValue,
        scheduledFor: jobData.scheduledFor,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error saving job to database:', error);
      throw error;
    }
  }

  async removeJobFromDatabase(jobId) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const collection = db.collection('job_cache');

      await collection.deleteOne({ jobId });
    } catch (error) {
      console.error('Error removing job from database:', error);
      throw error;
    }
  }

  // Schedule a job to expire a key
  async scheduleKeyExpiration(keysystemId, sessionId, keyValue, expiresAt) {
    const jobId = `key_expire_${keysystemId}_${sessionId}_${keyValue}`;
    const expireTime = new Date(expiresAt);
    
    const jobData = {
      type: 'key_expiration',
      keysystemId,
      sessionId,
      keyValue,
      scheduledFor: expireTime
    };

    // Store job info in memory
    this.jobs.set(jobId, jobData);

    // Store job info in database
    await this.saveJobToDatabase(jobId, jobData);

    console.log(`Scheduled key expiration for ${keyValue} at ${expireTime}`);
  }

  // Schedule a job to clear cooldown
  async scheduleCooldownCleanup(keysystemId, sessionId, cooldownTill) {
    const jobId = `cooldown_cleanup_${keysystemId}_${sessionId}`;
    const cleanupTime = new Date(cooldownTill);
    
    const jobData = {
      type: 'cooldown_cleanup',
      keysystemId,
      sessionId,
      scheduledFor: cleanupTime
    };

    // Store job info in memory
    this.jobs.set(jobId, jobData);

    // Store job info in database
    await this.saveJobToDatabase(jobId, jobData);

    console.log(`Scheduled cooldown cleanup for session ${sessionId} at ${cleanupTime}`);
  }

  // Start cron jobs that run every minute to check for expired items
  startCronJobs() {
    // Run every minute to check for expired keys and cooldowns
    cron.schedule('* * * * *', async () => {
      if (this.isInitialized) {
        await this.processExpiredJobs();
      }
    });

    console.log('Job queue cron jobs started');
  }

  async processExpiredJobs() {
    const now = new Date();
    const expiredJobs = [];

    // Find expired jobs
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.scheduledFor <= now) {
        expiredJobs.push({ jobId, ...job });
      }
    }

    // Process expired jobs
    for (const job of expiredJobs) {
      await this.executeJob(job);
    }
  }

  async executeJob(job) {
    try {
      if (job.type === 'key_expiration') {
        await this.expireKey(job.keysystemId, job.sessionId, job.keyValue);
      } else if (job.type === 'cooldown_cleanup') {
        await this.clearCooldown(job.keysystemId, job.sessionId);
      }

      // Remove processed job from memory and database
      this.jobs.delete(job.jobId);
      await this.removeJobFromDatabase(job.jobId);
      console.log(`Processed job: ${job.jobId}`);
    } catch (error) {
      console.error(`Error processing job ${job.jobId}:`, error);
      // Remove failed job to prevent infinite retries
      this.jobs.delete(job.jobId);
      await this.removeJobFromDatabase(job.jobId);
    }
  }

  async expireKey(keysystemId, sessionId, keyValue) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const collection = db.collection('customers');

      const result = await collection.updateOne(
        { 
          'keysystems.id': keysystemId,
          [`keysystems.keys.${sessionId}.keys.value`]: keyValue
        },
        { 
          $set: {
            [`keysystems.$[ks].keys.${sessionId}.keys.$[key].status`]: 'expired'
          }
        },
        {
          arrayFilters: [
            { 'ks.id': keysystemId },
            { 'key.value': keyValue }
          ]
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Key ${keyValue} expired for session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error expiring key:', error);
      throw error;
    }
  }

  async clearCooldown(keysystemId, sessionId) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const collection = db.collection('customers');

      const result = await collection.updateOne(
        { 'keysystems.id': keysystemId },
        { 
          $set: {
            [`keysystems.$.keys.${sessionId}.cooldown_till`]: null
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Cooldown cleared for session ${sessionId}`);
      }
    } catch (error) {
      console.error('Error clearing cooldown:', error);
      throw error;
    }
  }

  // Get job statistics
  getStats() {
    const stats = {
      totalJobs: this.jobs.size,
      keyExpirationJobs: 0,
      cooldownCleanupJobs: 0
    };

    for (const job of this.jobs.values()) {
      if (job.type === 'key_expiration') {
        stats.keyExpirationJobs++;
      } else if (job.type === 'cooldown_cleanup') {
        stats.cooldownCleanupJobs++;
      }
    }

    return stats;
  }

  // Method to manually trigger startup job loading (for testing)
  async restoreJobsOnStartup() {
    await this.loadJobsFromDatabase();
  }
}

// Create singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
