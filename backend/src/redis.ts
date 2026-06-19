import { createClient } from 'redis';

let redisClient: any = null;
const memoryCache = new Map<string, { value: any; expiry: number }>();

export async function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const client = createClient({ url: redisUrl });
    client.on('error', (err) => {
      console.warn('Redis connection error, falling back to memory cache:', err.message);
    });
    await client.connect();
    redisClient = client;
    console.log('Redis connected successfully.');
  } catch (err: any) {
    console.warn('Could not connect to Redis, using in-memory cache fallback. Error:', err.message);
  }
}

export async function getCache(key: string): Promise<any> {
  if (redisClient) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      // fallback to memory
    }
  }
  const mem = memoryCache.get(key);
  if (mem) {
    if (Date.now() < mem.expiry) {
      return mem.value;
    } else {
      memoryCache.delete(key);
    }
  }
  return null;
}

export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch {
      // fallback to memory
    }
  }
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}
