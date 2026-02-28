import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const results = await redis.get('results') ?? [];
    return res.status(200).json(results);
  }
  if (req.method === 'POST') {
    await redis.set('results', req.body);
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
