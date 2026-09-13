const { cacheGet, cacheSet, isRedisConnected } = require("../config/redis");

// Generate cache key from request
function generateCacheKey(req, prefix = "cache") {
  const userId = req.user?.id || "anonymous";
  const role = req.user?.role || "guest";
  const url = req.originalUrl || req.url;
  return `${prefix}:${role}:${userId}:${url}`;
}

// Response caching middleware
function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    if (!isRedisConnected()) return next();

    // Only cache GET requests
    if (req.method !== "GET") return next();

    const key = generateCacheKey(req);

    try {
      const cached = await cacheGet(key);
      if (cached) {
        return res.json(cached);
      }
    } catch {
      // Continue without cache on error
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

// Invalidate cache for specific patterns
function invalidateCache(...patterns) {
  return async (req, res, next) => {
    // Run after response is sent
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { cacheDelPattern } = require("../config/redis");
        for (const pattern of patterns) {
          const resolvedPattern = typeof pattern === "function" ? pattern(req) : pattern;
          await cacheDelPattern(resolvedPattern).catch(() => {});
        }
      }
    });
    next();
  };
}

// User-specific cache invalidation
function invalidateUserCache(req) {
  const userId = req.user?.id;
  if (userId && isRedisConnected()) {
    const { cacheDelPattern } = require("../config/redis");
    cacheDelPattern(`*:${userId}:*`).catch(() => {});
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  generateCacheKey,
};
