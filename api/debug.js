// Visit /api/debug in your browser to check if Redis sync is working
// Remove this file once everything is confirmed working
 
export default async function handler(req, res) {
  const BASE_URL = process.env.DinnerHacks_KV_REST_API_URL?.replace(/\/$/, "");
  const TOKEN    = process.env.DinnerHacks_KV_REST_API_TOKEN;
 
  if (!BASE_URL || !TOKEN) {
    return res.status(200).json({
      status: "❌ MISSING",
      message: "DinnerHacks_KV_REST_API_URL or DinnerHacks_KV_REST_API_TOKEN not set in Vercel env vars",
    });
  }
 
  try {
    // Test write
    const writeRes = await fetch(`${BASE_URL}/set/debug-test?EX=60`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(JSON.stringify({ ts: Date.now(), msg: "ping" })),
    });
    const writeJson = await writeRes.json();
 
    // Test read
    const readRes = await fetch(`${BASE_URL}/get/debug-test`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const readJson = await readRes.json();
 
    // Check main data key
    const dataRes = await fetch(`${BASE_URL}/get/mealhacked:family-data`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const dataJson = await dataRes.json();
    const hasData = !!dataJson.result;
 
    return res.status(200).json({
      status: writeJson.result === "OK" ? "✅ WORKING" : "⚠️ WRITE FAILED",
      writeResult: writeJson,
      readResult: readJson,
      familyDataExists: hasData,
      familyDataSize: hasData ? JSON.stringify(dataJson.result).length + " chars" : "none",
    });
  } catch (err) {
    return res.status(200).json({ status: "❌ ERROR", error: err.message });
  }
}
