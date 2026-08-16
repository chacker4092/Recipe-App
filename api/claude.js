// ── Helpers ───────────────────────────────────────────────────────────────────

// Decode HTML entities — importantly the fraction & numeric ones that carry
// recipe QUANTITIES (e.g. &#189; → ½). The old code replaced these with a space,
// silently dropping amounts from ingredients.
const NAMED_ENTITIES = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&#39;": "'",
  "&nbsp;": " ", "&deg;": "°", "&hellip;": "…", "&mdash;": "—", "&ndash;": "–",
  "&rsquo;": "\u2019", "&lsquo;": "\u2018", "&rdquo;": "\u201D", "&ldquo;": "\u201C",
  "&frac12;": "½", "&frac14;": "¼", "&frac34;": "¾", "&frac13;": "⅓", "&frac23;": "⅔",
  "&frac18;": "⅛", "&frac38;": "⅜", "&frac58;": "⅝", "&frac78;": "⅞",
};
function decodeEntities(str) {
  if (str == null) return "";
  let s = String(str);
  s = s.replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 10)); } catch { return " "; } });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch { return " "; } });
  s = s.replace(/&[a-zA-Z][a-zA-Z0-9]*;/g, m => (NAMED_ENTITIES[m] !== undefined ? NAMED_ENTITIES[m] : m));
  return s;
}

// ISO-8601 duration ("PT6H30M") → friendly text ("6 hrs 30 min")
function isoDurationToText(iso) {
  if (!iso || typeof iso !== "string") return iso || "";
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!m) return iso;
  const d = +m[1] || 0, h = +m[2] || 0, min = +m[3] || 0;
  const parts = [];
  if (d) parts.push(`${d} day${d > 1 ? "s" : ""}`);
  if (h) parts.push(`${h} hr${h > 1 ? "s" : ""}`);
  if (min) parts.push(`${min} min`);
  return parts.join(" ") || iso;
}

// Flatten recipeInstructions: plain strings, HowToStep objects, and HowToSection
// groups (which nest their steps under itemListElement).
function flattenInstructions(instr) {
  const out = [];
  const walk = (node) => {
    if (!node) return;
    if (typeof node === "string") { out.push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node === "object") {
      if (node["@type"] === "HowToSection" && node.itemListElement) { walk(node.itemListElement); return; }
      if (node.text) { out.push(node.text); return; }
      if (node.itemListElement) { walk(node.itemListElement); return; }
      if (node.name) { out.push(node.name); return; }
    }
  };
  walk(instr);
  return out.map(s => decodeEntities(String(s)).trim()).filter(Boolean).join("\n");
}

// Collect every object out of a parsed JSON-LD blob, following @graph nesting.
function collectLdItems(data) {
  const stack = Array.isArray(data) ? [...data] : [data];
  const items = [];
  const seen = new Set();
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (Array.isArray(node)) { stack.push(...node); continue; }
    items.push(node);
    if (node["@graph"]) stack.push(...(Array.isArray(node["@graph"]) ? node["@graph"] : [node["@graph"]]));
  }
  return items;
}

// Block server-side fetches to loopback / private / link-local hosts (basic SSRF guard).
function isFetchableUrl(u) {
  let parsed;
  try { parsed = new URL(u); } catch { return false; }
  if (!/^https?:$/.test(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (host === "0.0.0.0" || host === "::1") return false;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  if (/^169\.254\./.test(host) || /^fe80:/i.test(host) || /^fc00:/i.test(host) || /^fd/i.test(host)) return false;
  return true;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ── URL fetch mode ──────────────────────────────────────────────────────────
  if (req.body?.fetchUrl) {
    const targetUrl = req.body.fetchUrl;
    if (!isFetchableUrl(targetUrl)) {
      return res.status(400).json({ error: "That URL can't be fetched. Use a public http(s) recipe link." });
    }

    // Abort slow pages so the serverless function doesn't hang to the platform limit.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const pageRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      const html = await pageRes.text();

      // Strategy 1: Extract JSON-LD structured recipe data (most accurate) ───────
      const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const match of jsonLdMatches) {
        let data;
        try { data = JSON.parse(match[1].trim()); } catch { continue; }
        const items = collectLdItems(data);
        for (const item of items) {
          const t = item["@type"];
          const isRecipe = t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
          if (!isRecipe) continue;

          const ingredients = (item.recipeIngredient || item.ingredients || [])
            .map(i => decodeEntities(String(i)).trim())
            .filter(Boolean)
            .join("\n");
          const instructions = flattenInstructions(item.recipeInstructions);

          // Only treat as "structured" if it actually carries a recipe body,
          // otherwise fall through to HTML strategies rather than returning blanks.
          if (!ingredients && !instructions) continue;

          const name = decodeEntities(item.name || "");
          const yieldRaw = Array.isArray(item.recipeYield) ? item.recipeYield[0] : item.recipeYield;
          const yield_ = decodeEntities(yieldRaw == null ? "" : String(yieldRaw));
          const time = isoDurationToText(item.totalTime || item.cookTime || "");

          const text = `RECIPE NAME: ${name}\nYIELD: ${yield_}\nTIME: ${time}\n\nINGREDIENTS:\n${ingredients}\n\nINSTRUCTIONS:\n${instructions}`;
          return res.status(200).json({ text: text.slice(0, 8000), source: "structured" });
        }
      }

      // Strategy 2: Find the recipe card section in HTML and extract text ────────
      let recipeSection = "";
      const recipePatterns = [
        /class="wprm-recipe[\s\S]*?(?=<div class="(?:comments|related|sidebar|footer))/i,
        /class="tasty-recipes[\s\S]*?(?=<div class="(?:comments|related|sidebar|footer))/i,
        /class="recipe-card[\s\S]*?(?=<div class="(?:comments|related|sidebar|footer))/i,
        /id="recipe[\s\S]*?(?=<div (?:class|id)="(?:comments|related|sidebar|footer))/i,
        /<h[23][^>]*>(?:Ingredients?|Recipe)<\/h[23]>[\s\S]{50,3000}/i,
      ];
      for (const pattern of recipePatterns) {
        const m = html.match(pattern);
        if (m && m[0].length > 100) { recipeSection = m[0]; break; }
      }

      // Strategy 3: Full page text strip, focused on the densest content area ────
      if (!recipeSection) {
        recipeSection = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/<nav[\s\S]*?<\/nav>/gi, "")
          .replace(/<header[\s\S]*?<\/header>/gi, "")
          .replace(/<footer[\s\S]*?<\/footer>/gi, "");
      }

      // Strip tags, decode entities (preserving fraction quantities), collapse space
      const text = decodeEntities(recipeSection.replace(/<[^>]+>/g, " "))
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 8000);

      return res.status(200).json({ text, source: "html" });
    } catch (err) {
      const msg = err?.name === "AbortError" ? "Page fetch timed out" : `Page fetch failed: ${err.message}`;
      return res.status(500).json({ error: msg });
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Claude API proxy mode (unchanged) ─────────────────────────────────────────
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
