
import cron from 'node-cron';
import clientPromise from './mongodb.js';

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.initialized = false;
    this.startCronJobs();
    this.initializeFromDatabase();
  }

  async initializeFromDatabase() {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const jobCollection = db.collection('job_cache');

      // Get all pending jobs from database
      const pendingJobs = await jobCollection.find({}).toArray();
      
      const now = new Date();
      
      for (const job of pendingJobs) {
        // If job was supposed to run in the past, execute it immediately
        if (job.scheduledFor <= now) {
          console.log(`Executing overdue job: ${job.jobId}`);
          await this.executeJob(job);
          await this.removeJobFromDatabase(job.jobId);
        } else {
          // Add job back to memory for future execution
          this.jobs.set(job.jobId, {
            type: job.type,
            keysystemId: job.keysystemId,
            sessionId: job.sessionId,
            keyValue: job.keyValue,
            scheduledFor: new Date(job.scheduledFor)
          });
          console.log(`Restored job: ${job.jobId}`);
        }
      }

      this.initialized = true;
      console.log(`Job queue initialized with ${this.jobs.size} pending jobs`);
    } catch (error) {
      console.error('Error initializing job queue from database:', error);
      this.initialized = true; // Continue even if there's an error
    }
  }

  async saveJobToDatabase(jobId, jobData) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const jobCollection = db.collection('job_cache');

      await jobCollection.insertOne({
        jobId,
        type: jobData.type,
        keysystemId: jobData.keysystemId,
        sessionId: jobData.sessionId,
        keyValue: jobData.keyValue || null,
        scheduledFor: jobData.scheduledFor,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error saving job to database:', error);
    }
  }

  async removeJobFromDatabase(jobId) {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const jobCollection = db.collection('job_cache');

      await jobCollection.deleteOne({ jobId });
    } catch (error) {
      console.error('Error removing job from database:', error);
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

    // Save to database
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

    // Save to database
    await this.saveJobToDatabase(jobId, jobData);

    console.log(`Scheduled cooldown cleanup for session ${sessionId} at ${cleanupTime}`);
  }

  // Start cron jobs that run every minute to check for expired items
  startCronJobs() {
    // Run every minute to check for expired keys and cooldowns
    cron.schedule('* * * * *', async () => {
      if (this.initialized) {
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
      try {
        await this.executeJob(job);

        // Remove from memory and database
        this.jobs.delete(job.jobId);
        await this.removeJobFromDatabase(job.jobId);
        
        console.log(`Processed and removed job: ${job.jobId}`);
      } catch (error) {
        console.error(`Error processing job ${job.jobId}:`, error);
        // Remove failed job to prevent infinite retries
        this.jobs.delete(job.jobId);
        await this.removeJobFromDatabase(job.jobId);
      }
    }
  }

  async executeJob(job) {
    if (job.type === 'key_expiration') {
      await this.expireKey(job.keysystemId, job.sessionId, job.keyValue);
    } else if (job.type === 'cooldown_cleanup') {
      await this.clearCooldown(job.keysystemId, job.sessionId);
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

  // Clean up database on application shutdown (optional)
  async cleanup() {
    try {
      const client = await clientPromise;
      const db = client.db('Cryptix');
      const jobCollection = db.collection('job_cache');

      // Optionally clear all jobs on shutdown
      // await jobCollection.deleteMany({});
      console.log('Job queue cleanup completed');
    } catch (error) {
      console.error('Error during job queue cleanup:', error);
    }
  }
}

// Create singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
