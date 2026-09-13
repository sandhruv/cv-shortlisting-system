const { Queue, Worker } = require("bullmq");
const { getRedisClient, isRedisConnected } = require("../config/redis");

const QUEUE_NAME = "resume-processing";

// Create queue (only if Redis is available)
let resumeQueue = null;

function getQueue() {
  if (!isRedisConnected()) return null;
  if (resumeQueue) return resumeQueue;

  try {
    const redis = getRedisClient();
    resumeQueue = new Queue(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 50,
        removeOnFail: 20,
      },
    });
    return resumeQueue;
  } catch {
    return null;
  }
}

// Add job to queue
async function addResumeJob(data) {
  const queue = getQueue();
  if (!queue) return null;

  try {
    const job = await queue.add("parse-resume", data);
    return job;
  } catch (err) {
    console.error("Failed to add resume job to queue:", err.message);
    return null;
  }
}

// Process queue (called once on server start)
function setupResumeWorker(processFn) {
  if (!isRedisConnected()) return null;

  try {
    const redis = getRedisClient();
    const worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        return await processFn(job.data, job);
      },
      {
        connection: redis,
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    worker.on("completed", (job) => {
      console.log(`✅ Resume job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`❌ Resume job ${job?.id} failed:`, err.message);
    });

    return worker;
  } catch (err) {
    console.warn("⚠️ Failed to setup resume worker:", err.message);
    return null;
  }
}

// Get queue stats
async function getQueueStats() {
  const queue = getQueue();
  if (!queue) return null;

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  } catch {
    return null;
  }
}

// Clean old jobs
async function cleanQueue() {
  const queue = getQueue();
  if (!queue) return;

  try {
    await queue.clean(24 * 60 * 60 * 1000, 100); // Clean jobs older than 24 hours
  } catch {
    // Silently fail
  }
}

module.exports = {
  addResumeJob,
  setupResumeWorker,
  getQueueStats,
  cleanQueue,
};
