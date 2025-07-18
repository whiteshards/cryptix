
import cron from 'node-cron';
import clientPromise from './mongodb.js';

class JobQueue {
  constructor() {
    this.jobs = new Map();
    this.startCronJobs();
  }

  // Schedule a job to expire a key
  scheduleKeyExpiration(keysystemId, sessionId, keyValue, expiresAt) {
    const jobId = `key_expire_${keysystemId}_${sessionId}_${keyValue}`;
    const expireTime = new Date(expiresAt);
    
    // Store job info
    this.jobs.set(jobId, {
      type: 'key_expiration',
      keysystemId,
      sessionId,
      keyValue,
      scheduledFor: expireTime
    });

    console.log(`Scheduled key expiration for ${keyValue} at ${expireTime}`);
  }

  // Schedule a job to clear cooldown
  scheduleCooldownCleanup(keysystemId, sessionId, cooldownTill) {
    const jobId = `cooldown_cleanup_${keysystemId}_${sessionId}`;
    const cleanupTime = new Date(cooldownTill);
    
    // Store job info
    this.jobs.set(jobId, {
      type: 'cooldown_cleanup',
      keysystemId,
      sessionId,
      scheduledFor: cleanupTime
    });

    console.log(`Scheduled cooldown cleanup for session ${sessionId} at ${cleanupTime}`);
  }

  // Start cron jobs that run every minute to check for expired items
  startCronJobs() {
    // Run every minute to check for expired keys and cooldowns
    cron.schedule('* * * * *', async () => {
      await this.processExpiredJobs();
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
        if (job.type === 'key_expiration') {
          await this.expireKey(job.keysystemId, job.sessionId, job.keyValue);
        } else if (job.type === 'cooldown_cleanup') {
          await this.clearCooldown(job.keysystemId, job.sessionId);
        }

        // Remove processed job
        this.jobs.delete(job.jobId);
        console.log(`Processed job: ${job.jobId}`);
      } catch (error) {
        console.error(`Error processing job ${job.jobId}:`, error);
        // Remove failed job to prevent infinite retries
        this.jobs.delete(job.jobId);
      }
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
}

// Create singleton instance
const jobQueue = new JobQueue();

export default jobQueue;
