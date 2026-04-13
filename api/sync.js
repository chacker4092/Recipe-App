import { Redis } from "@upstash/redis";
 
const KEY = "mealhacked:family-data";
 
// Redis.fromEnv() automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// which Vercel sets when you connect an Upstash database
let redis;
try {
  redis = Redis.fromEnv();
} catch(e) {
  redis = null;
}
 
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
 
  // Redis not configured — fall back to localStorage
  if (!redis) {
    return res.status(200).json({ fallback: true, reason: "Redis not configured" });
  }
 
  try {
    if (req.method === "GET") {
      const data = await redis.get(KEY);
      if (!data) return res.status(200).json({ fallback: true, reason: "No data yet" });
      // Upstash auto-parses JSON, so data may already be an object
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return res.status(200).json({ data: parsed });
    }
 
    if (req.method === "POST") {
      // Store with 30-day expiry (so stale data auto-clears)
      await redis.set(KEY, JSON.stringify(req.body), { ex: 60 * 60 * 24 * 30 });
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    // Never crash the app — silently fall back to localStorage
    console.error("Sync error:", err.message);
    return res.status(200).json({ fallback: true, reason: err.message });
  }
 
  return res.status(405).json({ error: "Method not allowed" });
}
