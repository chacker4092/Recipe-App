const KEY = "mealhacked:family-data";
 
async function redisGet() {
  const url = `${process.env.DinnerHacks_KV_REST_API_URL}/get/${KEY}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.DinnerHacks_KV_REST_API_TOKEN}` },
  });
  const json = await res.json();
  if (!json.result) return null;
  try { return JSON.parse(json.result); } catch { return json.result; }
}
 
async function redisSet(data) {
  const url = `${process.env.DinnerHacks_KV_REST_API_URL}/set/${KEY}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DinnerHacks_KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    // Set 30-day expiry so stale data auto-clears
    body: JSON.stringify([JSON.stringify(data), "EX", 60 * 60 * 24 * 30]),
  });
}
 
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
 
  // Not configured — fall back to localStorage silently
  if (!process.env.DinnerHacks_KV_REST_API_URL || !process.env.DinnerHacks_KV_REST_API_TOKEN) {
    return res.status(200).json({ fallback: true, reason: "KV not configured" });
  }
 
  try {
    if (req.method === "GET") {
      const data = await redisGet();
      if (!data) return res.status(200).json({ fallback: true, reason: "No data yet" });
      return res.status(200).json({ data });
    }
 
    if (req.method === "POST") {
      await redisSet(req.body);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error("Sync error:", err.message);
    return res.status(200).json({ fallback: true, reason: err.message });
  }
 
  return res.status(405).json({ error: "Method not allowed" });
}
