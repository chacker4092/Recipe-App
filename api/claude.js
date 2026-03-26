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
    try {
      const pageRes = await fetch(req.body.fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });
 
      const html = await pageRes.text();
 
      // Strategy 1: Extract JSON-LD structured recipe data (most accurate)
      const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const match of jsonLdMatches) {
        try {
          const data = JSON.parse(match[1]);
          const items = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])];
          for (const item of items) {
            if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
              // Found structured recipe data — extract cleanly
              const ingredients = (item.recipeIngredient || []).join('\n');
              const instructions = Array.isArray(item.recipeInstructions)
                ? item.recipeInstructions.map(s => typeof s === 'string' ? s : (s.text || '')).join('\n')
                : String(item.recipeInstructions || '');
              const name = item.name || '';
              const yield_ = Array.isArray(item.recipeYield) ? item.recipeYield[0] : (item.recipeYield || '');
              const time = item.totalTime || item.cookTime || '';
              const text = `RECIPE NAME: ${name}\nYIELD: ${yield_}\nTIME: ${time}\n\nINGREDIENTS:\n${ingredients}\n\nINSTRUCTIONS:\n${instructions}`;
              return res.status(200).json({ text: text.slice(0, 8000), source: 'structured' });
            }
          }
        } catch(e) { /* try next */ }
      }
 
      // Strategy 2: Find the recipe card section in HTML and extract text
      // Look for common recipe card containers
      let recipeSection = '';
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
 
      // Strategy 3: Full page text strip, but focused on the densest content area
      if (!recipeSection) {
        recipeSection = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<header[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '');
      }
 
      // Clean HTML tags from whatever section we found
      const text = recipeSection
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 8000);
 
      return res.status(200).json({ text, source: 'html' });
    } catch (err) {
      return res.status(500).json({ error: `Page fetch failed: ${err.message}` });
    }
  }
 
  // ── Claude API proxy mode ───────────────────────────────────────────────────
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
