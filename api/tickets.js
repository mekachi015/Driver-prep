import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
    || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
    || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      `Redis env vars missing. url=${url ? 'ok' : 'MISSING'} token=${token ? 'ok' : 'MISSING'}. ` +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN) in Vercel.'
    );
  }
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  let redis;
  try {
    redis = getRedis();
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: e.message });
  }

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
