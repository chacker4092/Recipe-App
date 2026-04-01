// /api/sync.js — Shared state sync using Vercel KV (Upstash Redis)
// Setup: In Vercel dashboard → Storage → Create KV database → link to project
// This adds KV_REST_API_URL and KV_REST_API_TOKEN env vars automatically

const KV_KEY = "mealhacked:family-data";

async function kvGet() {
  const url = `${process.env.KV_REST_API_URL}/get/${KV_KEY}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  });
  const json = await res.json();
  return json.result ? JSON.parse(json.result) : null;
}

async function kvSet(data) {
  const url = `${process.env.KV_REST_API_URL}/set/${KV_KEY}`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify(data)), // KV stores strings
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // KV not configured — tell client to use localStorage only
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ fallback: true, reason: "KV not configured" });
  }

  try {
    if (req.method === "GET") {
      const data = await kvGet();
      if (!data) return res.status(200).json({ fallback: true, reason: "No data yet" });
      return res.status(200).json({ data });
    }

    if (req.method === "POST") {
      await kvSet(req.body);
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    // Don't crash the app — just fall back to localStorage
    return res.status(200).json({ fallback: true, reason: err.message });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
