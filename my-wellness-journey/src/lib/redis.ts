import Redis from 'ioredis';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Handle Redis connection events
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

// Cache TTL in seconds (24 hours)
export const CACHE_TTL = 24 * 60 * 60;

// Helper function to generate cache key
export const generateCacheKey = (prompt: string, query?: string, userProfile?: any): string => {
  const components = [
    prompt || '',
    query || '',
    userProfile ? JSON.stringify(userProfile) : ''
  ];
  return `gpt:${components.join('::')}`;
};

export default redis; 