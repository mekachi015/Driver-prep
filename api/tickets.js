async function redisGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const r = await fetch(`${url}/get/${key}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await r.json();
  return json.result ? JSON.parse(json.result) : null;
}

async function redisSet(key, value) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  await fetch(`${url}/set/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([JSON.stringify(value)]),
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tickets = await redisGet('tickets') ?? {};
    return res.status(200).json(tickets);
  }
  if (req.method === 'POST') {
    await redisSet('tickets', req.body);
    return res.status(200).json({ ok: true });
  }
  res.status(405).end();
}
