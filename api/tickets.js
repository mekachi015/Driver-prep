import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  });
  if (req.method === 'GET') {
    const tickets = await redis.get('tickets') ?? {};
    return res.status(200).json(tickets);
  }
  if (req.method === 'POST') {
    await redis.set('tickets', req.body);
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
