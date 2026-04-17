import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

export function getRedis() {
  if (redis !== undefined) {
    return redis;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return redis;
  }

  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redis;
}
