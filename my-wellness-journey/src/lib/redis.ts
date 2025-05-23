import Redis from 'ioredis';

const redisOptions = {
  maxRetriesPerRequest: null, // Disable max retries per request
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  connectTimeout: 10000,
  commandTimeout: 5000,
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands when disconnected
  maxReconnectTime: 1000, // Maximum time between reconnection attempts
  retries: 10, // Maximum number of retries per command
  keepAlive: 1000, // Send a ping every 1000ms to keep connection alive
};

// Initialize Redis client with more detailed error handling
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisOptions);

let isRedisReady = false;

// Handle Redis connection events
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
  isRedisReady = false;
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis client is ready');
  isRedisReady = true;
});

redis.on('reconnecting', () => {
  console.log('Redis client is reconnecting...');
  isRedisReady = false;
});

redis.on('end', () => {
  console.log('Redis connection ended');
  isRedisReady = false;
});

// Cache TTL in seconds (24 hours)
export const CACHE_TTL = 24 * 60 * 60;

// Helper function to check if Redis is available
export const isRedisAvailable = () => isRedisReady;

// Helper function to generate cache key
export const generateCacheKey = (prompt: string, query?: string, userProfile?: any): string => {
  const components = [
    prompt || '',
    query || '',
    userProfile ? JSON.stringify(userProfile) : ''
  ];
  return `gpt:${components.join('::')}`;
};

// Wrapper for Redis operations that gracefully handles failures
export const safeRedisOperation = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  if (!isRedisReady) return fallback;
  
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    return fallback;
  }
};

export default redis; 