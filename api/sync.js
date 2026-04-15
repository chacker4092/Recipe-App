const KEY = "mealhacked:family-data";
const BASE_URL = () => process.env.DinnerHacks_KV_REST_API_URL?.replace(/\/$/, "");
const TOKEN    = () => process.env.DinnerHacks_KV_REST_API_TOKEN;
 
function headers() {
  return {
    Authorization: `Bearer ${TOKEN()}`,
    "Content-Type": "application/json",
  };
}
 
async function redisGet() {
  const res = await fetch(`${BASE_URL()}/get/${KEY}`, { headers: headers() });
  const json = await res.json();
  if (!json.result) return null;
  // Upstash returns the value as a string — parse it
  try { return typeof json.result === "string" ? JSON.parse(json.result) : json.result; }
  catch { return null; }
}
 
async function redisSet(data) {
  // Correct Upstash REST syntax: POST /set/KEY with value as body string
  // EX (expiry) passed as query param
  const THIRTY_DAYS = 60 * 60 * 24 * 30;
  const res = await fetch(`${BASE_URL()}/set/${KEY}?EX=${THIRTY_DAYS}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(JSON.stringify(data)), // value must be a JSON-encoded string
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}
 
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
 
  if (!BASE_URL() || !TOKEN()) {
    return res.status(200).json({ fallback: true, reason: "KV env vars not set" });
  }
 
  try {
    if (req.method === "GET") {
      const data = await redisGet();
      if (!data) return res.status(200).json({ fallback: true, reason: "No data in Redis yet" });
      return res.status(200).json({ ok: true, data });
    }
 
    if (req.method === "POST") {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid body" });
      }
      await redisSet(req.body);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error("Sync error:", err.message);
    return res.status(200).json({ fallback: true, reason: err.message });
  }
 
  return res.status(405).json({ error: "Method not allowed" });
}
