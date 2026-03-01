import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('Redis env vars not set. Provide UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.');
  }
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  const redis = getRedis();

  if (req.method === 'GET') {
    const tickets = (await redis.get('tickets')) ?? {};
    return res.status(200).json(tickets);
  }
  if (req.method === 'POST') {
    await redis.set('tickets', JSON.stringify(req.body));
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
