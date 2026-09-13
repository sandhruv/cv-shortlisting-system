const Redis = require("ioredis");

let redis = null;
let isConnected = false;
let connectionPool = [];

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function createRedisClient() {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null;
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 5000,
      keepAlive: 30000,
      enableOfflineQueue: true,
      maxLoadingTimeout: 5000,
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
      isConnected = true;
    });

    redis.on("ready", () => {
      console.log("✅ Redis ready");
    });

    redis.on("error", (err) => {
      if (isConnected) {
        console.error("❌ Redis error:", err.message);
      }
      isConnected = false;
    });

    redis.on("close", () => {
      isConnected = false;
    });

    return redis;
  } catch (err) {
    console.warn("⚠️ Redis not available, running without cache:", err.message);
    return null;
  }
}

function getRedisClient() {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

function isRedisConnected() {
  return isConnected && redis && redis.status === "ready";
}

async function connectRedis() {
  const client = getRedisClient();
  if (client) {
    try {
      await client.connect();
    } catch (err) {
      console.warn("⚠️ Redis connection failed, running without cache:", err.message);
    }
  }
}

async function disconnectRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
  }
}

// Cache helper with automatic JSON serialization
async function cacheGet(key) {
  if (!isRedisConnected()) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 300) {
  if (!isRedisConnected()) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silently fail cache writes
  }
}

async function cacheDel(key) {
  if (!isRedisConnected()) return;
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

async function cacheDelPattern(pattern) {
  if (!isRedisConnected()) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Silently fail
  }
}

// Connection pool for high-concurrency scenarios
function getPoolClient() {
  if (connectionPool.length < 5) {
    const poolClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 3000,
      keepAlive: 30000,
    });
    connectionPool.push(poolClient);
    return poolClient;
  }
  // Round-robin through pool
  const client = connectionPool.shift();
  connectionPool.push(client);
  return client;
}

module.exports = {
  getRedisClient,
  getPoolClient,
  isRedisConnected,
  connectRedis,
  disconnectRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
};
