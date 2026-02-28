export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { pin } = req.body;

  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: "Incorrect PIN" });
  }

  // Simple time-stamped token — valid for 8 hours
  const token = Buffer.from(`admin:${Date.now() + 8 * 60 * 60 * 1000}`).toString("base64");
  return res.status(200).json({ token });
}
