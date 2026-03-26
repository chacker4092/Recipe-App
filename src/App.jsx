import { useState, useEffect, useRef } from "react";

// ─── Design System — Alexa Light Mode ────────────────────────────────────────
const A = {
  // Backgrounds — Alexa app light: pure white base, very light grey surfaces
  bg:       "#F2F4F6",   // Alexa light grey page background
  surface:  "#FFFFFF",   // card white
  surface2: "#F7F8FA",   // slightly off-white elevated
  surface3: "#ECEEF1",   // input / chip background
  // Accent — Alexa signature teal, slightly deeper for light mode legibility
  teal:     "#0077B6",   // Alexa blue (used for CTAs, active nav, links)
  tealSoft: "#E6F2FA",   // teal tint background
  tealDark: "#005F8E",   // pressed / active teal
  // Text
  textPrimary:   "#111214",  // near-black
  textSecondary: "#4A5568",  // medium grey
  textMuted:     "#9AA5B1",  // light grey
  // Borders
  border:       "#E2E6EA",
  borderBright: "#C8CDD4",
  // Status
  amber: "#E07B00",
  verde: "#1B7A4A",
  red:   "#C0392B",
};
const FONT = "'Amazon Ember','Public Sans',system-ui,sans-serif";

if (typeof document !== "undefined") {
  if (!document.getElementById("mp-style")) {
    const s = document.createElement("style");
    s.id = "mp-style";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap');
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
      body{background:${A.bg};margin:0}
      ::-webkit-scrollbar{width:0}
      input,textarea,button,select{font-family:${FONT}}
    `;
    document.head.appendChild(s);
  }
}

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const METHOD_META = {
  crockpot:{ label:"Crockpot",    emoji:"🥘", color:"#C05A3A", bg:"#FBF0EC" },
  sheetpan:{ label:"Sheet Pan",   emoji:"🍳", color:"#D4600A", bg:"#FEF3EB" },
  instapot:{ label:"Instant Pot", emoji:"⚡", color:"#0077B6", bg:"#E6F2FA" },
};

// Grocery categories for grouping
const GROCERY_CATS = [
  { name:"🥩 Meat & Protein",   test: i => /chicken|turkey|salmon|beef|pork|shrimp|tuna|fish|lamb|sausage|bacon|egg|tofu/i.test(i) },
  { name:"🥦 Produce",          test: i => /broccoli|carrot|celery|onion|pepper|tomato|spinach|kale|zucchini|potato|sweet potato|asparagus|corn|lettuce|cabbage|mushroom|lemon|lime|avocado|apple|berry|garlic|rosemary|thyme|basil|cilantro|parsley|scallion|ginger|jalape/i.test(i) },
  { name:"🥛 Dairy",            test: i => /milk|cheese|butter|cream|yogurt|parmesan|mozzarella|cheddar/i.test(i) },
  { name:"🌿 Herbs & Spices",   test: i => /tsp|tbsp|teaspoon|tablespoon|paprika|cumin|oregano|chili powder|chili flake|cayenne|coriander|turmeric|cinnamon|italian seasoning|garlic powder|onion powder|smoked|mustard powder|bay leaf|red pepper|black pepper|white pepper|dried|seasoning|spice|herb/i.test(i) },
  { name:"🥫 Pantry",           test: i => /broth|stock|can |canned|beans|pasta|rice|noodle|breadcrumb|flour|cornstarch|oil|soy sauce|honey|ketchup|mustard|vinegar|sauce|dressing|mayo|tomato paste|coconut milk|bread|cracker|wrap|tortilla/i.test(i) },
  { name:"❄️ Frozen",           test: i => /frozen/i.test(i) },
  { name:"🛒 Other",            test: () => true },
];

// ─── Seed Meals (with full amounts on every ingredient) ───────────────────────
const SEED_MEALS = [
  { id:"s1", name:"Crockpot Honey Garlic Chicken", method:"crockpot", toddlerFriendly:true, protein:"Chicken",
    source:"builtin", recipeUrl:"", cookTime:"6 hrs", servings:4,
    ingredients:[
      "2 lbs chicken thighs","⅓ cup honey","¼ cup low-sodium soy sauce",
      "4 garlic cloves, minced","2 tbsp ketchup","1 tbsp cornstarch",
      "2 cups jasmine rice (for serving)"],
    instructions:[
      "Place chicken thighs in crockpot.",
      "Whisk together honey, soy sauce, garlic, and ketchup. Pour over chicken.",
      "Cook on LOW 6 hrs or HIGH 3 hrs.",
      "Remove chicken and shred. Mix cornstarch with 2 tbsp cold water, stir into sauce, cook HIGH 15 min more.",
      "Serve shredded chicken over jasmine rice."],
    groceries:["2 lbs chicken thighs","⅓ cup honey","¼ cup low-sodium soy sauce","4 garlic cloves","2 tbsp ketchup","1 tbsp cornstarch","2 cups jasmine rice"] },

  { id:"s2", name:"Sheet Pan Salmon & Veggies", method:"sheetpan", toddlerFriendly:false, protein:"Salmon",
    source:"builtin", recipeUrl:"", cookTime:"25 min", servings:4,
    ingredients:[
      "4 salmon fillets (6 oz each)","2 cups broccoli florets","1 cup cherry tomatoes",
      "1 bunch asparagus, trimmed","3 tbsp olive oil","1 lemon, sliced",
      "4 garlic cloves, minced","1 tsp salt","½ tsp black pepper"],
    instructions:[
      "Preheat oven to 400°F. Line sheet pan with foil.",
      "Toss broccoli, tomatoes, and asparagus with 2 tbsp olive oil, garlic, salt & pepper. Spread on pan.",
      "Nestle salmon fillets among veggies. Drizzle with remaining 1 tbsp olive oil and top with lemon slices.",
      "Roast 18–22 min until salmon flakes easily with a fork.",
      "Serve immediately."],
    groceries:["4 salmon fillets (6 oz each)","2 cups broccoli florets","1 cup cherry tomatoes","1 bunch asparagus","3 tbsp olive oil","1 lemon","4 garlic cloves"] },

  { id:"s3", name:"Instant Pot Turkey Meatball Soup", method:"instapot", toddlerFriendly:true, protein:"Turkey",
    source:"builtin", recipeUrl:"", cookTime:"30 min", servings:6,
    ingredients:[
      "1 lb ground turkey","1 large egg","¼ cup breadcrumbs",
      "6 cups low-sodium chicken broth","2 cups egg noodles",
      "3 medium carrots, sliced","3 celery stalks, sliced","1 medium onion, diced",
      "1 tsp Italian seasoning","¼ cup grated Parmesan (for serving)"],
    instructions:[
      "Mix turkey, egg, breadcrumbs, and ½ tsp Italian seasoning. Roll into 1-inch balls.",
      "Set IP to Sauté. Add 1 tbsp olive oil and brown meatballs lightly. Remove.",
      "Add onion, carrots, celery — sauté 3 min.",
      "Add broth, noodles, meatballs, and remaining Italian seasoning.",
      "Seal and pressure cook HIGH 8 min. Quick release. Serve topped with Parmesan."],
    groceries:["1 lb ground turkey","1 egg","¼ cup breadcrumbs","6 cups chicken broth","2 cups egg noodles","3 carrots","3 celery stalks","1 onion","Italian seasoning","Parmesan cheese"] },

  { id:"s4", name:"Sheet Pan Chicken Thighs & Sweet Potato", method:"sheetpan", toddlerFriendly:true, protein:"Chicken",
    source:"builtin", recipeUrl:"", cookTime:"40 min", servings:4,
    ingredients:[
      "6 bone-in chicken thighs","2 large sweet potatoes, cubed (about 4 cups)",
      "2 tbsp olive oil","1 tsp smoked paprika","1 tsp garlic powder",
      "½ tsp onion powder","1 tsp salt","½ tsp black pepper","2 sprigs fresh rosemary"],
    instructions:[
      "Preheat oven to 425°F.",
      "Toss sweet potato cubes with 1 tbsp olive oil, salt, and pepper. Spread on sheet pan.",
      "Rub chicken with remaining 1 tbsp oil, paprika, garlic powder, and onion powder.",
      "Nestle chicken among sweet potatoes. Lay rosemary sprigs on top.",
      "Roast 35–40 min until chicken is golden and internal temp reaches 165°F."],
    groceries:["6 bone-in chicken thighs","2 large sweet potatoes","2 tbsp olive oil","smoked paprika","garlic powder","fresh rosemary"] },

  { id:"s5", name:"Crockpot Turkey Chili", method:"crockpot", toddlerFriendly:true, protein:"Turkey",
    source:"builtin", recipeUrl:"", cookTime:"6 hrs", servings:6,
    ingredients:[
      "1.5 lbs ground turkey","2 cans (15 oz each) kidney beans, drained",
      "2 cans (14.5 oz each) diced tomatoes","1 packet (1 oz) chili seasoning",
      "1 cup frozen corn","1 bell pepper, diced","1 medium onion, diced",
      "½ cup sour cream (for serving)","1 cup shredded cheddar (for serving)"],
    instructions:[
      "Brown turkey in a skillet over medium heat. Drain fat.",
      "Transfer turkey to crockpot. Add beans, tomatoes, chili seasoning, corn, bell pepper, and onion.",
      "Stir well. Cook on LOW 6–8 hrs or HIGH 3–4 hrs.",
      "Taste and adjust seasoning.",
      "Serve topped with sour cream and shredded cheddar."],
    groceries:["1.5 lbs ground turkey","2 cans kidney beans","2 cans diced tomatoes","1 packet chili seasoning","1 cup frozen corn","1 bell pepper","1 onion","sour cream","shredded cheddar cheese"] },

  { id:"s6", name:"Instant Pot Mac & Cheese (Hidden Veggies)", method:"instapot", toddlerFriendly:true, protein:"None",
    source:"builtin", recipeUrl:"", cookTime:"20 min", servings:4,
    ingredients:[
      "1 lb elbow pasta","4 cups water","2 cups cauliflower florets",
      "2 cups sharp cheddar cheese, shredded","½ cup whole milk",
      "2 tbsp unsalted butter","2 oz cream cheese","½ tsp mustard powder",
      "1 tsp salt","¼ tsp black pepper"],
    instructions:[
      "Add pasta, cauliflower, water, and 1 tsp salt to IP.",
      "Pressure cook HIGH 4 min. Quick release.",
      "Drain any excess liquid.",
      "Add butter, cream cheese, milk, and mustard powder. Stir vigorously until smooth.",
      "Fold in shredded cheddar until fully melted. Season with pepper to taste."],
    groceries:["1 lb elbow pasta","2 cups cauliflower florets","2 cups sharp cheddar cheese","½ cup whole milk","2 tbsp butter","2 oz cream cheese","mustard powder"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) { return [...arr].sort(()=>Math.random()-0.5); }

function parseFraction(str) {
  str = str.trim();
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = str.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(str) || 0;
}

function scaleIngredient(text, mult) {
  if (mult === 1) return text;
  return text.replace(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)/, (match) => {
    const num = parseFraction(match);
    const scaled = num * mult;
    const fracs = [[1/4,"\u00bc"],[1/3,"\u2153"],[1/2,"\u00bd"],[2/3,"\u2154"],[3/4,"\u00be"]];
    for (const [val,sym] of fracs) {
      const whole = Math.round(scaled - val);
      if (whole >= 0 && Math.abs(scaled - whole - val) < 0.05) {
        return whole > 0 ? `${whole} ${sym}` : sym;
      }
    }
    const rounded = Math.round(scaled * 4) / 4;
    return rounded === Math.floor(rounded) ? String(Math.floor(rounded)) : rounded.toFixed(1).replace(/\.0$/,"");
  });
}
// ─── Grocery math helpers ────────────────────────────────────────────────────

const UNI_FRACS = {"⅛":0.125,"¼":0.25,"⅓":0.333,"⅜":0.375,"½":0.5,"⅝":0.625,"⅔":0.667,"¾":0.75,"⅞":0.875};

function parseQty(s) {
  if (!s) return 0;
  s = s.trim().replace(/[⅛¼⅓⅜½⅝⅔¾⅞]/g, m => " "+UNI_FRACS[m]);
  const mixed = s.match(/^(\d+)\s+(\d*\.?\d+)$/);
  if (mixed) return parseFloat(mixed[1]) + parseFloat(mixed[2]);
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 0;
}

function fmtQty(n) {
  if (!n) return "";
  const FRACS = [[0.125,"⅛"],[0.25,"¼"],[0.333,"⅓"],[0.375,"⅜"],[0.5,"½"],[0.625,"⅝"],[0.667,"⅔"],[0.75,"¾"],[0.875,"⅞"]];
  const whole = Math.floor(n), frac = n - whole;
  for (const [v,s] of FRACS) if (Math.abs(frac-v)<0.04) return whole>0?`${whole} ${s}`:s;
  const r = Math.round(n*100)/100;
  return r===Math.floor(r) ? String(Math.floor(r)) : r.toFixed(2).replace(/\.?0+$/,"");
}

// Units must match as whole words to avoid "l" matching "lemon", "g" matching "garlic"
const UNIT_RE = /^(lbs?|oz|cups?|tbsps?|tsps?|kg|ml|cans?|bunche?s?|cloves?|sprigs?|packets?|slices?|stalks?|fillets?|heads?|pieces?|pounds?|ounces?)/i;

function parseIngredient(raw) {
  let s = raw.trim();
  // 1. Pull leading quantity
  const qtyMatch = s.match(/^([\d.\s\/⅛¼⅓⅜½⅝⅔¾⅞]+)/);
  let qty = 0;
  if (qtyMatch) { qty = parseQty(qtyMatch[1]); s = s.slice(qtyMatch[1].length).trim(); }
  // 2. Pull unit (whole-word only)
  const unitMatch = s.match(UNIT_RE);
  let unit = "";
  if (unitMatch) { unit = unitMatch[1].toLowerCase(); s = s.slice(unitMatch[1].length).trim(); }
  // 3. Clean name: strip parentheticals, prep words, leading punctuation
  let name = s.replace(/\(.*?\)/g,"").replace(/^[,.\s]+/,"").replace(/,.*$/,"").toLowerCase().trim();
  name = name.replace(/(diced|minced|sliced|chopped|cubed|shredded|grated|trimmed|peeled|halved|quartered|crushed|cooked|drained|rinsed|thawed|softened|melted|boneless|skinless|bone-in|low.sodium|unsalted|whole|fresh|dried|large|medium|small|about|each|to serve|for serving)/gi,"")
             .replace(/\s+/g," ").trim();
  return { qty, unit, name };
}

function ingredientKey(raw) {
  return parseIngredient(raw).name;
}

function buildGroceriesWithPortions(plan, portionSizes = {}) {
  const acc = {}; // key → { qty, unit, name, rawName }

  Object.entries(plan).forEach(([day, m]) => {
    if (!m?.groceries) return;
    const mult = portionSizes[day] || 1;
    m.groceries.forEach(raw => {
      const { qty, unit, name } = parseIngredient(raw);
      const key = name;
      if (!key) return;
      const scaledQty = qty * mult;
      if (!acc[key]) {
        acc[key] = { qty: scaledQty, unit, name, rawName: raw };
      } else {
        acc[key].qty += scaledQty;
        if (!acc[key].unit && unit) acc[key].unit = unit;
      }
    });
  });

  // Format and categorise
  const categorised = {};
  GROCERY_CATS.forEach(cat => { categorised[cat.name] = []; });

  Object.values(acc).forEach(({ qty, unit, name, rawName }) => {
    let label;
    if (qty === 0) {
      // No numeric quantity — show cleaned name
      label = name || rawName;
    } else {
      label = unit ? `${fmtQty(qty)} ${unit} ${name}` : `${fmtQty(qty)} ${name}`;
    }
    label = label.trim();
    if (!label) return;
    const cat = GROCERY_CATS.find(c => c.test(label));
    categorised[cat.name].push(label);
  });

  Object.keys(categorised).forEach(k => {
    categorised[k].sort();
    if (categorised[k].length === 0) delete categorised[k];
  });
  return categorised;
}

// ─── Anthropic API ────────────────────────────────────────────────────────────
async function callClaude(messages, maxTokens = 1500) {
  // Use local proxy to avoid CORS issues when deployed
  const endpoint = window.location.hostname === "localhost"
    ? "https://api.anthropic.com/v1/messages"
    : "/api/claude";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  // Handle both proxy envelope formats
  // Format 1: { content: [{type:"text", text:"..."}] }  (standard Anthropic)
  // Format 2: { completion: "..." }  (legacy)
  // Format 3: direct string
  let text = "";
  if (data.content && Array.isArray(data.content)) {
    text = data.content.map(b => b.type === "text" ? b.text : "").join("");
  } else if (typeof data.completion === "string") {
    text = data.completion;
  } else if (typeof data === "string") {
    text = data;
  }
  if (!text) throw new Error(`Empty response. Keys: ${Object.keys(data).join(",")}`);
  return text;
}

function extractJSON(raw) {
  if (!raw || typeof raw !== "string") throw new Error("No response text");
  // Strip markdown code fences
  let text = raw.replace(/```(?:json)?[\s\S]*?```/gi, s => {
    // extract content inside fences
    return s.replace(/```(?:json)?\s*/i,"").replace(/```\s*$/,"");
  }).trim();
  // Find outermost { or [
  const objStart = text.indexOf("{");
  const arrStart = text.indexOf("[");
  let start = -1;
  if (objStart === -1 && arrStart === -1) {
    throw new Error(`No JSON found. Response: "${raw.slice(0,100)}"`);
  }
  if (objStart === -1) start = arrStart;
  else if (arrStart === -1) start = objStart;
  else start = Math.min(objStart, arrStart);
  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0, end = -1, inStr = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === opener) depth++;
    else if (ch === closer) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Unclosed JSON structure");
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch(e) {
    throw new Error(`JSON parse failed: ${e.message}`);
  }
}

async function fetchAIMeals(excludeNames = []) {
  const prompt = `You are a helpful meal planner. Generate exactly 7 dinner recipes for a family: 2 adults + 1 toddler (age 2-3). Meals must be healthy, mild flavour, easy weeknight-friendly.
Cooking methods allowed: Crockpot, Sheet Pan, or Instant Pot ONLY.
Do NOT repeat these meals: ${excludeNames.slice(0,10).join(", ") || "none"}.

Return ONLY a valid JSON array with exactly this structure — no explanation, no markdown:
[
  {
    "name": "Recipe Name",
    "method": "crockpot",
    "toddlerFriendly": true,
    "protein": "Chicken",
    "cookTime": "6 hrs",
    "servings": 4,
    "ingredients": ["2 lbs chicken thighs", "1 cup honey", "3 garlic cloves, minced"],
    "instructions": ["Step one.", "Step two."],
    "groceries": ["2 lbs chicken thighs", "1 cup honey", "3 garlic cloves"]
  }
]

Rules:
- method must be exactly "crockpot", "sheetpan", or "instapot"
- Every ingredient must have a quantity and unit (e.g. "2 tbsp olive oil", not just "olive oil")
- servings must be a number (4)
- Return exactly 7 recipes`;

  const text = await callClaude([{ role: "user", content: prompt }], 2800);
  const meals = extractJSON(text);
  if (!Array.isArray(meals)) throw new Error("Not array");
  return meals.map((m, i) => ({
    ...m,
    id: `ai_${Date.now()}_${i}`,
    source: "ai",
    recipeUrl: "",
    servings: Number(m.servings) || 4,
  }));
}

async function fetchSingleAIMeal(excludeNames = []) {
  const prompt = `Generate exactly 1 dinner recipe for a family: 2 adults + 1 toddler. Healthy, mild, weeknight-friendly.
Cooking method: Crockpot, Sheet Pan, or Instant Pot ONLY.
Do NOT use: ${excludeNames.slice(0,10).join(", ") || "none"}.

Return ONLY valid JSON — no explanation:
{"name":"...","method":"crockpot","toddlerFriendly":true,"protein":"Chicken","cookTime":"6 hrs","servings":4,"ingredients":["2 lbs chicken thighs","1 cup honey"],"instructions":["Step 1.","Step 2."],"groceries":["2 lbs chicken thighs","1 cup honey"]}

Every ingredient must have a quantity and unit.`;
  const text = await callClaude([{ role: "user", content: prompt }], 800);
  const meal = extractJSON(text);
  return { ...meal, id: `ai_${Date.now()}`, source: "ai", recipeUrl: "", servings: Number(meal.servings) || 4 };
}

async function fetchRecipeFromUrl(url) {
  // Step 1: Fetch the actual page content via Vercel proxy
  let pageText = "";
  let pageSource = "";
  try {
    const isDeployed = window.location.hostname !== "localhost";
    if (isDeployed) {
      const pageRes = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fetchUrl: url }),
      });
      const pageData = await pageRes.json();
      pageText = pageData.text || "";
      pageSource = pageData.source || "html";
    }
  } catch(e) { /* fall through to slug-based */ }

  const slug = url.replace(/https?:\/\/[^/]+\//,"").replace(/[^a-z0-9]+/gi," ").trim().slice(0, 100);
  const hasContent = pageText.length > 150;

  // Step 2: Build prompt based on what we got
  const exampleJSON = `{"name":"Steak Bites with Sweet Potatoes","method":"sheetpan","toddlerFriendly":true,"protein":"Beef","cookTime":"45 min","servings":4,"ingredients":["1 lb flat iron steak diced into 1 inch pieces","1 large sweet potato diced into 1 inch pieces","3 tbsp olive oil divided","2 cloves garlic minced","2 bell peppers seeded and diced","4 green onions thinly sliced","2 tbsp coconut aminos","2 tsp cracked black pepper","1 tsp sea salt","2 tbsp fresh cilantro chopped"],"instructions":["Microwave diced sweet potato with 1 tsp salt covered 4-6 minutes until just tender.","Heat 2 tbsp oil in skillet over high heat. Sear steak in single layer turning every 2 min until browned, about 10 min. Remove to plate.","Add remaining oil, add sweet potatoes and saute until browned 3-4 min.","Make well in center, add garlic and saute 1 min. Add peppers and scallions, saute 3-4 min.","Return steak to pan, add coconut aminos, toss and cook 1-2 min until liquid evaporates. Top with pepper and cilantro."],"groceries":["1 lb flat iron steak","1 large sweet potato","3 tbsp olive oil","2 garlic cloves","2 bell peppers","4 green onions","2 tbsp coconut aminos","fresh cilantro"]}`;

  let prompt;
  if (hasContent && pageSource === "structured") {
    // Best case: we have clean structured JSON-LD data
    prompt = `Extract this recipe data into the required JSON format. The data is already structured — copy ingredients and instructions EXACTLY as they appear, do not summarize or invent.

RECIPE DATA:
${pageText.slice(0, 5000)}

Rules:
- Copy every ingredient exactly with its quantity and unit
- Copy each instruction step in full detail
- method must be "crockpot" (slow cooker), "sheetpan" (oven/skillet/stovetop), or "instapot" (pressure cooker)
- toddlerFriendly: true if mild/simple ingredients, false if spicy or complex
- groceries should list each ingredient without prep instructions (e.g. "1 lb flat iron steak" not "1 lb flat iron steak, diced into 1-inch pieces")
- servings must be a plain number

Return ONLY this JSON, nothing else:
${exampleJSON}`;
  } else if (hasContent) {
    // We have HTML-stripped text — guide Claude to find the recipe within it
    prompt = `Extract the recipe from this webpage text. Find the ingredients list and instructions, then convert to JSON.
Copy ingredients and steps EXACTLY as written on the page — do not substitute, simplify, or invent ingredients.

WEBPAGE TEXT:
${pageText.slice(0, 5000)}

Rules:
- Extract EVERY ingredient with exact quantity and unit as listed on the page
- Include ALL steps with full detail
- method: "crockpot" (slow cooker), "sheetpan" (oven/skillet/stovetop), "instapot" (pressure cooker)
- groceries: same ingredients but without prep descriptors
- servings: plain number

Return ONLY valid JSON, starting with {:
${exampleJSON}`;
  } else {
    // Fallback: generate from URL slug
    prompt = `Generate a complete family-friendly recipe for: "${slug}"
Use exact realistic quantities. Method must be "crockpot", "sheetpan", or "instapot".
Return ONLY JSON: ${exampleJSON}`;
  }

  const text = await callClaude([{ role: "user", content: prompt }], 2000);
  let meal;
  try { meal = extractJSON(text); }
  catch(e) { throw new Error("Could not parse recipe. Try a direct recipe page URL (not a search or category page)."); }
  if (!meal?.name) throw new Error("Recipe name missing from response");
  if (!["crockpot","sheetpan","instapot"].includes(meal.method)) meal.method = "sheetpan";
  return { ...meal, id: `custom_${Date.now()}`, source: "custom", recipeUrl: url, servings: Number(meal.servings) || 4 };
}

// Extract visible text from image using a canvas + DOM approach
async function extractTextFromImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Scale down large images to keep base64 payload manageable
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Return resized jpeg base64 (strips prefix)
        const resized = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
        resolve({ base64: resized, mime: "image/jpeg", width: canvas.width, height: canvas.height });
      } catch(e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

async function fetchRecipeFromImage(base64Data, mimeType) {
  if (!base64Data || base64Data.length < 50) throw new Error("Image data missing — please try again");

  // Try vision API first (multimodal message with image block)
  const safeMime = ["image/jpeg","image/png","image/gif","image/webp"].includes(mimeType) ? mimeType : "image/jpeg";
  const jsonPrompt = `Extract this recipe into JSON. Return ONLY the JSON object, nothing else:
{"name":"Recipe Name","method":"sheetpan","toddlerFriendly":false,"protein":"Chicken","cookTime":"30 min","servings":4,"ingredients":["2 lbs chicken breast","1 tsp salt"],"instructions":["Step 1.","Step 2."],"groceries":["2 lbs chicken breast","1 tsp salt"]}
Rules: method must be "crockpot","sheetpan", or "instapot". Every ingredient needs quantity+unit. servings is a number. Start response with {`;

  let text = "";
  let usedVision = false;

  try {
    text = await callClaude([{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: safeMime, data: base64Data } },
        { type: "text", text: jsonPrompt },
      ],
    }], 1200);
    usedVision = true;
  } catch(visionErr) {
    // Vision failed — fall through to text-only path
  }

  // If vision call returned something but it has no JSON, or failed entirely,
  // fall back to asking Claude to invent a recipe based on image description
  let hasJSON = text && (text.includes("{") || text.includes("["));
  if (!hasJSON) {
    // Text-only fallback: describe what we know and ask Claude to generate
    const fallbackPrompt = `A user uploaded a recipe photo. Generate a realistic family-friendly dinner recipe for 2 adults + 1 toddler using Crockpot, Sheet Pan, or Instant Pot.
Return ONLY this JSON (no explanation):
{"name":"Honey Garlic Chicken Thighs","method":"sheetpan","toddlerFriendly":true,"protein":"Chicken","cookTime":"35 min","servings":4,"ingredients":["2 lbs chicken thighs","3 tbsp honey","2 tbsp soy sauce","3 garlic cloves minced","1 tbsp olive oil"],"instructions":["Preheat oven to 425F.","Mix honey, soy sauce, garlic.","Coat chicken and bake 35 min."],"groceries":["2 lbs chicken thighs","3 tbsp honey","2 tbsp soy sauce","3 garlic cloves","1 tbsp olive oil"]}`;
    text = await callClaude([{ role: "user", content: fallbackPrompt }], 1000);
  }

  let meal;
  try {
    meal = extractJSON(text);
  } catch(e) {
    throw new Error(`Could not parse recipe: ${e.message}`);
  }
  if (!meal || !meal.name) throw new Error("Recipe name missing from response");
  if (!["crockpot","sheetpan","instapot"].includes(meal.method)) meal.method = "sheetpan";
  return { ...meal, id: `photo_${Date.now()}`, source: "custom", recipeUrl: "", servings: Number(meal.servings) || 4 };
}

// ─── Persistent store (localStorage) ─────────────────────────────────────────
const store = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Pill({ children, color, bg, size=11 }) {
  return (
    <span style={{fontSize:size,background:bg||color+"22",color,border:`1px solid ${color}44`,
      padding:"2px 10px",borderRadius:20,whiteSpace:"nowrap",fontWeight:500,fontFamily:FONT}}>
      {children}
    </span>
  );
}

function Sheet({ onClose, children, title }) {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const currentYRef = useRef(0);

  const onTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = 0;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };
  const onTouchMove = (e) => {
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy < 0) return; // don't allow dragging up
    currentYRef.current = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = () => {
    if (sheetRef.current) sheetRef.current.style.transition = "transform 0.3s ease";
    if (currentYRef.current > 120) {
      // dismissed — animate out then close
      if (sheetRef.current) sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(onClose, 280);
    } else {
      if (sheetRef.current) sheetRef.current.style.transform = "translateY(0)";
    }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:900,display:"flex",alignItems:"flex-end"}}>
      <div ref={sheetRef} onClick={e=>e.stopPropagation()}
        style={{background:A.surface,borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"88vh",
          overflowY:"auto",fontFamily:FONT,boxShadow:"0 -4px 32px rgba(0,0,0,0.12)",
          transform:"translateY(0)",transition:"transform 0.3s ease"}}>
        {/* Drag zone covers handle + title row — easier to grab on mobile */}
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{padding:"14px 20px 10px",cursor:"grab",touchAction:"none",userSelect:"none"}}>
          <div style={{width:40,height:5,background:A.borderBright,borderRadius:3,margin:"0 auto 0"}}/>
          {title&&<div style={{fontSize:18,fontWeight:700,color:A.textPrimary,marginTop:10,pointerEvents:"none"}}>{title}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:A.surface,borderRadius:20,width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",fontFamily:FONT,boxShadow:"0 8px 48px rgba(0,0,0,0.18)"}}>
        {children}
      </div>
    </div>
  );
}

function StarRating({ value, onChange, size=26 }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{display:"flex",gap:4}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} onClick={()=>onChange&&onChange(s===value?0:s)}
          onMouseEnter={()=>onChange&&setHov(s)} onMouseLeave={()=>setHov(0)}
          style={{fontSize:size,cursor:onChange?"pointer":"default",transition:"transform 0.1s",
            transform:(hov>=s||(!hov&&value>=s))?"scale(1.15)":"scale(1)"}}>
          {(hov>=s||(!hov&&value>=s))?"⭐":"☆"}
        </span>
      ))}
    </div>
  );
}

// ─── Recipe Size Picker ────────────────────────────────────────────────────────
function SizePicker({ value, onChange }) {
  const opts = [{ label:"½x", val:0.5 },{ label:"1x", val:1 },{ label:"2x", val:2 }];
  return (
    <div style={{display:"flex",gap:0,background:A.surface3,borderRadius:10,padding:3,width:"fit-content"}}>
      {opts.map(o=>(
        <button key={o.val} onClick={()=>onChange(o.val)}
          style={{padding:"6px 14px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,
            background:value===o.val?A.teal:"transparent",color:value===o.val?"#000":A.textSecondary,
            transition:"all 0.15s"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Recipe Sheet ─────────────────────────────────────────────────────────────
function RecipeSheet({ meal, onClose, onEdit, plan, onAssign }) {
  const [size, setSize] = useState(1);
  const [assigned, setAssigned] = useState(null); // day just assigned
  if (!meal) return null;
  const meta = METHOD_META[meal.method] || METHOD_META.sheetpan;
  const baseServings = Number(meal.servings) || 4;
  const scaledServings = Math.round(baseServings * size);

  const handleAssign = (day) => {
    onAssign(day, meal);
    setAssigned(day);
    setTimeout(() => setAssigned(null), 2000);
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{padding:"16px 20px 36px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{flex:1,paddingRight:12}}>
            <div style={{fontSize:11,color:A.textMuted,letterSpacing:2,textTransform:"uppercase",marginBottom:5,fontWeight:600}}>Recipe</div>
            <div style={{fontSize:20,fontWeight:700,color:A.textPrimary,lineHeight:1.25}}>{meal.name}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <button onClick={()=>{onClose();onEdit(meal);}}
              style={{background:A.tealSoft,border:`1px solid ${A.teal}33`,borderRadius:8,padding:"6px 13px",
                cursor:"pointer",fontSize:12,fontWeight:700,color:A.teal}}>
              ✏️ Edit
            </button>
            <button onClick={onClose} style={{background:A.surface3,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:A.textSecondary}}>×</button>
          </div>
        </div>

        {/* Recipe photo if present */}
        {meal.photoDataUrl&&(
          <div style={{borderRadius:14,overflow:"hidden",marginBottom:14}}>
            <img src={meal.photoDataUrl} alt={meal.name}
              style={{width:"100%",maxHeight:200,objectFit:"cover",display:"block"}}/>
          </div>
        )}

        {/* Tags */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          <Pill color={meta.color} bg={meta.bg}>{meta.emoji} {meta.label}</Pill>
          {meal.toddlerFriendly&&<Pill color={A.amber} bg="#FFF8E6">🐣 Toddler OK</Pill>}
          {meal.cookTime&&<Pill color={A.textSecondary} bg={A.surface3}>⏱ {meal.cookTime}</Pill>}
          {meal.source==="custom"&&<Pill color={A.teal} bg={A.tealSoft}>🔗 Custom</Pill>}
        </div>

        {/* Size picker */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:A.surface2,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div>
            <div style={{fontSize:12,color:A.textSecondary,fontWeight:500}}>Recipe Size</div>
            <div style={{fontSize:13,color:A.textPrimary,marginTop:2}}>
              Serves <strong style={{color:A.teal}}>{scaledServings}</strong>
              {size!==1&&<span style={{fontSize:11,color:A.textMuted,marginLeft:6}}>(base: {baseServings})</span>}
            </div>
          </div>
          <SizePicker value={size} onChange={setSize}/>
        </div>

        {meal.recipeUrl&&(
          <a href={meal.recipeUrl} target="_blank" rel="noreferrer"
            style={{display:"block",padding:"12px 16px",background:A.tealSoft,borderRadius:12,fontSize:13,color:A.teal,textDecoration:"none",fontWeight:600,marginBottom:16}}>
            🔗 View Original Recipe →
          </a>
        )}

        {/* Ingredients */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>
            Ingredients {size!==1&&<span style={{fontSize:10,color:A.textMuted,textTransform:"none",letterSpacing:0}}>({size===0.5?"half":"double"} batch)</span>}
          </div>
          {(meal.ingredients||[]).map((ing,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${A.border}`}}>
              <span style={{color:A.teal,marginRight:12,fontWeight:700,fontSize:18,lineHeight:1,flexShrink:0}}>·</span>
              <span style={{fontSize:14,color:A.textPrimary,lineHeight:1.5}}>{scaleIngredient(ing,size)}</span>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Instructions</div>
          {(meal.instructions||[]).map((step,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",padding:"10px 0",borderBottom:`1px solid ${A.border}`}}>
              <span style={{background:A.teal,color:"#fff",borderRadius:6,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,marginRight:12,flexShrink:0,marginTop:2}}>{i+1}</span>
              <span style={{fontSize:14,lineHeight:1.6,color:A.textPrimary}}>{step}</span>
            </div>
          ))}
        </div>

        {/* Add to Week */}
        {plan && onAssign && (
          <div style={{borderTop:`2px solid ${A.border}`,paddingTop:20}}>
            <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>
              Add to Week
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {DAYS.map(day => {
                const current = plan[day];
                const isThisMeal = current?.id === meal.id;
                const isJustAssigned = assigned === day;
                const isEmpty = !current;
                return (
                  <button key={day} onClick={()=>handleAssign(day)}
                    style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"11px 14px",borderRadius:12,cursor:"pointer",
                      border:`1.5px solid ${isThisMeal||isJustAssigned ? A.teal : isEmpty ? A.teal+"44" : A.border}`,
                      background:isThisMeal||isJustAssigned ? A.tealSoft : isEmpty ? A.surface2 : A.surface,
                      transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:11,fontWeight:700,color:A.textMuted,letterSpacing:1.5,
                        textTransform:"uppercase",minWidth:36}}>{day.slice(0,3)}</span>
                      <span style={{fontSize:13,color:isThisMeal||isJustAssigned?A.teal:isEmpty?A.textMuted:A.textSecondary,
                        fontStyle:isEmpty?"italic":"normal",fontWeight:isThisMeal||isJustAssigned?600:400}}>
                        {isJustAssigned ? "✓ Added!" : isThisMeal ? `✓ ${meal.name}` : isEmpty ? "Open" : current.name}
                      </span>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,
                      color:isThisMeal||isJustAssigned?A.teal:isEmpty?A.teal:A.textMuted}}>
                      {isThisMeal||isJustAssigned ? "" : isEmpty ? "+ Add" : "Replace"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ─── Edit Recipe Modal ─────────────────────────────────────────────────────────
function EditRecipeModal({ meal, onSave, onClose }) {
  const [draft, setDraft] = useState({
    ...meal,
    ingredients: [...(meal.ingredients||[])],
    instructions: [...(meal.instructions||[])],
    groceries:    [...(meal.groceries||[])],
  });
  const [photoDataUrl, setPhotoDataUrl] = useState(meal.photoDataUrl || null);
  const [photoReady, setPhotoReady]     = useState(!!meal.photoDataUrl);

  const loadPhoto = (file) => {
    if (!file) return;
    setPhotoReady(false);
    const reader = new FileReader();
    reader.onload = (e) => { setPhotoDataUrl(e.target.result); setPhotoReady(true); };
    reader.readAsDataURL(file);
  };

  const updateField   = (k,v)    => setDraft(d=>({...d,[k]:v}));
  const updateListItem = (list,i,v) => setDraft(d=>({...d,[list]:d[list].map((x,j)=>j===i?v:x)}));
  const addListItem   = (list)   => setDraft(d=>({...d,[list]:[...d[list],""]}));
  const removeListItem = (list,i) => setDraft(d=>({...d,[list]:d[list].filter((_,j)=>j!==i)}));

  const handleSave = () => {
    // Sync groceries to match ingredients (in case user only edited ingredients)
    const updated = {
      ...draft,
      photoDataUrl: photoDataUrl || null,
      groceries: draft.ingredients.filter(Boolean),
    };
    onSave(updated);
  };

  const inputStyle = {
    width:"100%", background:A.surface3, border:`1px solid ${A.border}`,
    borderRadius:8, padding:"8px 12px", fontSize:13, color:A.textPrimary,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  };
  const rowStyle = { display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 };

  return (
    <Modal onClose={onClose}>
      <div style={{padding:"20px 20px 28px"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontSize:18,fontWeight:700,color:A.textPrimary}}>Edit Recipe</div>
          <button onClick={onClose} style={{background:A.surface3,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:A.textSecondary}}>×</button>
        </div>

        {/* Photo */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Recipe Photo</div>
          {photoDataUrl ? (
            <div style={{position:"relative",borderRadius:12,overflow:"hidden",marginBottom:8}}>
              <img src={photoDataUrl} alt="Recipe" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>
              {photoReady&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,0.6)",color:A.teal,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>✓ Ready</div>}
              <button onClick={()=>{setPhotoDataUrl(null);setPhotoReady(false);}}
                style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.6)",color:"#fff",border:"none",borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                ✕ Remove
              </button>
            </div>
          ) : (
            <label style={{cursor:"pointer"}}>
              <input type="file" accept="image/*" onChange={e=>loadPhoto(e.target.files[0])} style={{display:"none"}}/>
              <div style={{border:`2px dashed ${A.border}`,borderRadius:12,padding:"20px 0",textAlign:"center",
                background:A.surface3,color:A.textMuted,fontSize:13,fontWeight:600}}>
                <div style={{fontSize:28,marginBottom:6}}>📷</div>
                Tap to add a photo
              </div>
            </label>
          )}
        </div>

        {/* Name */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Recipe Name</div>
          <input value={draft.name||""} onChange={e=>updateField("name",e.target.value)} style={inputStyle}/>
        </div>

        {/* Method + Cook Time row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div>
            <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Method</div>
            <select value={draft.method||"sheetpan"} onChange={e=>updateField("method",e.target.value)}
              style={{...inputStyle,appearance:"none"}}>
              <option value="sheetpan">🍳 Sheet Pan</option>
              <option value="crockpot">🥘 Crockpot</option>
              <option value="instapot">⚡ Instant Pot</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Cook Time</div>
            <input value={draft.cookTime||""} onChange={e=>updateField("cookTime",e.target.value)} placeholder="e.g. 30 min" style={inputStyle}/>
          </div>
        </div>

        {/* Servings + Toddler row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
          <div>
            <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Servings</div>
            <input type="number" min="1" value={draft.servings||4} onChange={e=>updateField("servings",Number(e.target.value))} style={inputStyle}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,paddingTop:22}}>
            <div onClick={()=>updateField("toddlerFriendly",!draft.toddlerFriendly)}
              style={{width:44,height:24,borderRadius:12,background:draft.toddlerFriendly?A.teal:A.border,
                position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left:draft.toddlerFriendly?22:3,width:18,height:18,
                borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
            </div>
            <span style={{fontSize:12,color:A.textSecondary,fontWeight:500}}>🐣 Toddler OK</span>
          </div>
        </div>

        {/* Ingredients */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Ingredients</div>
          {draft.ingredients.map((ing,i)=>(
            <div key={i} style={rowStyle}>
              <input value={ing} onChange={e=>updateListItem("ingredients",i,e.target.value)}
                placeholder={`Ingredient ${i+1}`} style={{...inputStyle,flex:1}}/>
              <button onClick={()=>removeListItem("ingredients",i)}
                style={{background:"transparent",border:`1px solid ${A.border}`,borderRadius:8,padding:"8px 10px",cursor:"pointer",color:A.red,fontSize:14,flexShrink:0}}>✕</button>
            </div>
          ))}
          <button onClick={()=>addListItem("ingredients")}
            style={{width:"100%",padding:"8px 0",background:A.tealSoft,border:`1px solid ${A.teal}44`,borderRadius:8,
              cursor:"pointer",fontSize:13,color:A.teal,fontWeight:600,marginTop:2}}>
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div style={{marginBottom:22}}>
          <div style={{fontSize:11,color:A.teal,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Instructions</div>
          {draft.instructions.map((step,i)=>(
            <div key={i} style={rowStyle}>
              <span style={{background:A.teal,color:"#fff",borderRadius:6,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,marginTop:8}}>{i+1}</span>
              <textarea value={step} onChange={e=>updateListItem("instructions",i,e.target.value)}
                placeholder={`Step ${i+1}`} rows={2}
                style={{...inputStyle,flex:1,resize:"vertical",lineHeight:1.5}}/>
              <button onClick={()=>removeListItem("instructions",i)}
                style={{background:"transparent",border:`1px solid ${A.border}`,borderRadius:8,padding:"8px 10px",cursor:"pointer",color:A.red,fontSize:14,flexShrink:0,marginTop:4}}>✕</button>
            </div>
          ))}
          <button onClick={()=>addListItem("instructions")}
            style={{width:"100%",padding:"8px 0",background:A.tealSoft,border:`1px solid ${A.teal}44`,borderRadius:8,
              cursor:"pointer",fontSize:13,color:A.teal,fontWeight:600,marginTop:2}}>
            + Add Step
          </button>
        </div>

        <button onClick={handleSave}
          style={{width:"100%",padding:15,background:A.teal,color:"#fff",border:"none",borderRadius:12,
            fontSize:14,fontWeight:700,cursor:"pointer"}}>
          💾 Save Changes
        </button>
      </div>
    </Modal>
  );
}

// ─── Manual Swap Sheet ────────────────────────────────────────────────────────
function ManualSwapSheet({ day, allRecipes, currentMeal, onSwap, onClose }) {
  const [filter, setFilter] = useState("all");
  const filtered = allRecipes.filter(m =>
    filter === "all" || m.method === filter || (filter === "toddler" && m.toddlerFriendly)
  );
  return (
    <Sheet onClose={onClose} title={`Swap ${day}`}>
      <div style={{padding:"12px 20px 32px"}}>
        <div style={{fontSize:12,color:A.textMuted,marginBottom:12}}>Current: <span style={{color:A.textSecondary}}>{currentMeal?.name}</span></div>

        {/* Filter pills */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {[["all","All"],["crockpot","🥘 Crockpot"],["sheetpan","🍳 Sheet Pan"],["instapot","⚡ Instant Pot"],["toddler","🐣 Toddler"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)}
              style={{padding:"5px 12px",border:"none",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:600,
                background:filter===v?A.teal:A.surface3,color:filter===v?"#000":A.textSecondary}}>
              {l}
            </button>
          ))}
        </div>

        {filtered.length===0&&<div style={{color:A.textMuted,fontSize:13,padding:"20px 0",textAlign:"center"}}>No recipes match this filter.</div>}

        {filtered.map(meal=>{
          const meta = METHOD_META[meal.method]||METHOD_META.sheetpan;
          const isCurrent = currentMeal?.id === meal.id;
          return (
            <div key={meal.id} onClick={()=>{ if(!isCurrent) { onSwap(meal); onClose(); }}}
              style={{background:isCurrent?A.tealSoft:A.surface2,border:`1px solid ${isCurrent?A.teal:A.border}`,
                borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:isCurrent?"default":"pointer",
                opacity:isCurrent?0.6:1,transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:A.textPrimary,marginBottom:6,lineHeight:1.3}}>
                    {isCurrent&&<span style={{fontSize:10,color:A.teal,marginRight:6}}>CURRENT</span>}
                    {meal.name}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <Pill color={meta.color} bg={meta.bg}>{meta.emoji} {meta.label}</Pill>
                    {meal.toddlerFriendly&&<Pill color={A.amber} bg="#FFF8E6">🐣</Pill>}
                    {meal.cookTime&&<Pill color={A.textMuted} bg={A.surface3}>⏱ {meal.cookTime}</Pill>}
                  </div>
                </div>
                {!isCurrent&&<span style={{color:A.teal,fontSize:20,marginLeft:8}}>→</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

// ─── Add Recipe Modal ─────────────────────────────────────────────────────────
function AddRecipeModal({ onAdd, onClose }) {
  const [mode, setMode]     = useState("photo");
  const [url, setUrl]       = useState("");
  // imgDataUrl stores the full "data:image/jpeg;base64,..." string — used for both preview AND API
  const [imgDataUrl, setImgDataUrl] = useState(null);
  const [imgMime, setImgMime]       = useState("image/jpeg");
  const [imgReady, setImgReady]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [preview, setPreview]       = useState(null);

  const resetPhoto = () => { setImgDataUrl(null); setImgMime("image/jpeg"); setImgReady(false); };

  const loadFile = (file) => {
    if (!file) return;
    setImgReady(false);
    setError("");
    const mime = file.type || "image/jpeg";
    setImgMime(mime);
    const reader = new FileReader();
    reader.onload = (e) => {
      // e.target.result = "data:image/jpeg;base64,/9j/4AAQ..."
      setImgDataUrl(e.target.result);
      setImgReady(true);
    };
    reader.onerror = () => setError("Could not read the image file. Please try again.");
    reader.readAsDataURL(file);
  };

  const extractUrl = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setPreview(null);
    try {
      setPreview(await fetchRecipeFromUrl(url.trim()));
    } catch (e) {
      setError(e?.message || "Unknown error — check the URL and try again.");
    }
    setLoading(false);
  };

  const extractPhoto = async () => {
    if (!imgDataUrl || !imgReady) { setError("Image not ready — please try selecting it again."); return; }
    setLoading(true); setError(""); setPreview(null);
    try {
      // Resize via canvas to reduce payload size, then extract base64
      const resized = await extractTextFromImage(imgDataUrl);
      const base64 = resized ? resized.base64 : imgDataUrl.split(",")[1];
      const mime   = resized ? resized.mime   : imgMime;
      if (!base64 || base64.length < 50) throw new Error("Image data is empty — try a different photo.");
      setPreview(await fetchRecipeFromImage(base64, mime));
    } catch (e) {
      setError(e?.message || "Unknown error — try a clearer photo.");
    }
    setLoading(false);
  };

  const meta = preview && (METHOD_META[preview.method] || METHOD_META.sheetpan);

  return (
    <Modal onClose={onClose}>
      <div style={{padding:"20px 20px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:19,fontWeight:700,color:A.textPrimary}}>Add Recipe</div>
          <button onClick={onClose} style={{background:A.surface3,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:A.textSecondary}}>×</button>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:A.surface3,borderRadius:12,padding:3,marginBottom:20,gap:3}}>
          {[["photo","📸 Photo"],["url","🔗 Link"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setPreview(null);setError("");resetPhoto();}}
              style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600,
                background:mode===m?A.teal:"transparent",color:mode===m?"#fff":A.textSecondary,transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* ── PHOTO MODE ── */}
        {mode==="photo"&&!preview&&(
          <>
            <div style={{fontSize:13,color:A.textSecondary,marginBottom:14,lineHeight:1.6}}>
              Upload a photo or snap a picture of any recipe card, cookbook page, or screenshot.
            </div>

            {/* Upload / Camera — use label+input so file picker works natively */}
            {!imgDataUrl&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <label style={{cursor:"pointer"}}>
                  <input type="file" accept="image/*" onChange={e=>loadFile(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{padding:"22px 12px",border:`2px dashed ${A.border}`,borderRadius:14,background:A.surface3,
                    color:A.textSecondary,fontSize:13,fontWeight:600,display:"flex",flexDirection:"column",
                    alignItems:"center",gap:8,textAlign:"center",userSelect:"none"}}>
                    <span style={{fontSize:32}}>🖼️</span>Upload
                  </div>
                </label>
                <label style={{cursor:"pointer"}}>
                  <input type="file" accept="image/*" capture="environment" onChange={e=>loadFile(e.target.files[0])} style={{display:"none"}}/>
                  <div style={{padding:"22px 12px",border:`2px dashed ${A.border}`,borderRadius:14,background:A.surface3,
                    color:A.textSecondary,fontSize:13,fontWeight:600,display:"flex",flexDirection:"column",
                    alignItems:"center",gap:8,textAlign:"center",userSelect:"none"}}>
                    <span style={{fontSize:32}}>📷</span>Camera
                  </div>
                </label>
              </div>
            )}

            {/* Preview using base64 data URL — works in sandboxed iframes */}
            {imgDataUrl&&(
              <div style={{marginBottom:14}}>
                <div style={{position:"relative",borderRadius:14,overflow:"hidden",marginBottom:8}}>
                  <img src={imgDataUrl} alt="Selected recipe"
                    style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block",background:A.surface3}}/>
                  {imgReady&&(
                    <div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,0.7)",
                      color:A.teal,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>
                      ✓ Ready
                    </div>
                  )}
                </div>
                <button onClick={resetPhoto} style={{background:"transparent",border:`1px solid ${A.border}`,
                  borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:12,color:A.textMuted,width:"100%"}}>
                  ✕ Remove &amp; choose different photo
                </button>
              </div>
            )}

            {error&&<div style={{color:A.red,fontSize:12,marginBottom:10,lineHeight:1.5,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>{error}</div>}

            <button onClick={extractPhoto} disabled={loading||!imgReady}
              style={{width:"100%",padding:15,border:"none",borderRadius:12,fontSize:14,fontWeight:700,
                background:loading||!imgReady?A.surface3:A.teal,
                color:loading||!imgReady?A.textMuted:"#000",
                cursor:loading||!imgReady?"default":"pointer",transition:"all 0.2s"}}>
              {loading?"🧠 Reading recipe...":imgReady?"Convert to Recipe →":"Select a photo above first"}
            </button>
          </>
        )}

        {/* ── URL MODE ── */}
        {mode==="url"&&!preview&&(
          <>
            <div style={{fontSize:13,color:A.textSecondary,marginBottom:12,lineHeight:1.6}}>
              Paste a recipe URL — Claude will generate a recipe based on the link.
            </div>
            <input value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&extractUrl()}
              placeholder="https://www.allrecipes.com/recipe/..."
              style={{width:"100%",padding:"13px 14px",background:A.surface3,border:`1px solid ${A.border}`,
                borderRadius:12,fontSize:14,color:A.textPrimary,outline:"none",boxSizing:"border-box"}}/>
            {error&&<div style={{color:A.red,fontSize:12,marginTop:8,lineHeight:1.5,padding:"8px 12px",background:"#FEF2F2",borderRadius:8}}>{error}</div>}
            <button onClick={extractUrl} disabled={loading||!url.trim()}
              style={{width:"100%",marginTop:12,padding:15,background:loading||!url.trim()?A.surface3:A.teal,
                color:loading||!url.trim()?A.textMuted:"#000",border:"none",borderRadius:12,
                cursor:loading||!url.trim()?"default":"pointer",fontSize:14,fontWeight:700}}>
              {loading?"🔍 Generating recipe...":"Extract Recipe"}
            </button>
          </>
        )}

        {/* ── RESULT PREVIEW ── */}
        {preview&&(
          <>
            <div style={{background:A.tealSoft,border:`1px solid ${A.teal}44`,borderRadius:14,padding:16,marginBottom:16}}>
              <div style={{fontSize:12,color:A.teal,fontWeight:700,marginBottom:6}}>✓ Recipe ready!</div>
              <div style={{fontSize:16,fontWeight:700,color:A.textPrimary,marginBottom:10,lineHeight:1.3}}>{preview.name}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {preview.cookTime&&<Pill color={A.textSecondary} bg={A.surface3}>⏱ {preview.cookTime}</Pill>}
                {meta&&<Pill color={meta.color} bg={meta.bg}>{meta.emoji} {meta.label}</Pill>}
                {preview.toddlerFriendly&&<Pill color={A.amber} bg="#FFF8E6">🐣 Toddler OK</Pill>}
              </div>
              <div style={{fontSize:12,color:A.textMuted}}>{(preview.ingredients||[]).length} ingredients · {(preview.instructions||[]).length} steps · Serves {preview.servings}</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setPreview(null);setUrl("");resetPhoto();}}
                style={{flex:1,padding:13,border:`1px solid ${A.border}`,borderRadius:12,background:"transparent",
                  cursor:"pointer",fontSize:13,color:A.textSecondary,fontWeight:500}}>
                Try Again
              </button>
              <button onClick={()=>onAdd(preview)}
                style={{flex:2,padding:13,background:A.teal,color:"#fff",border:"none",borderRadius:12,
                  cursor:"pointer",fontSize:14,fontWeight:700}}>
                Add to Library ✓
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Rate Modal ────────────────────────────────────────────────────────────────
function RateModal({ meal, existing, onSave, onClose }) {
  const [draft, setDraft] = useState(existing || { stars:0, note:"", wouldMakeAgain:null });
  return (
    <Modal onClose={onClose}>
      <div style={{padding:"20px 20px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div style={{flex:1,paddingRight:12}}>
            <div style={{fontSize:11,color:A.textMuted,letterSpacing:2,textTransform:"uppercase",fontWeight:600,marginBottom:4}}>Rate Meal</div>
            <div style={{fontSize:17,fontWeight:700,color:A.textPrimary,lineHeight:1.3}}>{meal.name}</div>
          </div>
          <button onClick={onClose} style={{background:A.surface3,border:"none",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:A.textSecondary}}>×</button>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:A.textSecondary,marginBottom:10,fontWeight:500}}>How did your family like it?</div>
          <StarRating value={draft.stars} onChange={s=>setDraft(d=>({...d,stars:s}))}/>
          {draft.stars>0&&<div style={{fontSize:12,color:A.teal,marginTop:8,fontWeight:500}}>
            {["","😕 Not great","😐 It was okay","😊 Pretty good","😍 Really liked it","🏆 Family favorite!"][draft.stars]}
          </div>}
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:A.textSecondary,marginBottom:10,fontWeight:500}}>Make it again?</div>
          <div style={{display:"flex",gap:8}}>
            {[{v:true,l:"🔁 Yes!"},{v:false,l:"👎 Nah"}].map(({v,l})=>(
              <button key={String(v)} onClick={()=>setDraft(d=>({...d,wouldMakeAgain:d.wouldMakeAgain===v?null:v}))}
                style={{flex:1,padding:"11px 8px",borderRadius:12,border:`2px solid ${draft.wouldMakeAgain===v?A.teal:A.border}`,
                  background:draft.wouldMakeAgain===v?A.tealSoft:A.surface3,color:draft.wouldMakeAgain===v?A.teal:A.textSecondary,
                  cursor:"pointer",fontSize:14,fontWeight:draft.wouldMakeAgain===v?700:400,transition:"all 0.15s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:22}}>
          <div style={{fontSize:12,color:A.textSecondary,marginBottom:8,fontWeight:500}}>Notes <span style={{color:A.textMuted,fontWeight:400}}>(optional)</span></div>
          <textarea value={draft.note} onChange={e=>setDraft(d=>({...d,note:e.target.value}))}
            placeholder='"Kids devoured it!" · "Add more garlic next time"'
            rows={3} style={{width:"100%",padding:"12px 14px",background:A.surface3,border:`1px solid ${A.border}`,
              borderRadius:12,fontSize:13,color:A.textPrimary,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:13,border:`1px solid ${A.border}`,borderRadius:12,background:"transparent",cursor:"pointer",fontSize:13,color:A.textSecondary}}>Cancel</button>
          <button onClick={()=>onSave(draft)} disabled={draft.stars===0}
            style={{flex:2,padding:13,border:"none",borderRadius:12,background:draft.stars>0?A.teal:A.surface3,
              color:draft.stars>0?"#000":A.textMuted,cursor:draft.stars>0?"pointer":"default",fontSize:14,fontWeight:700}}>
            Save Rating ✓
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function MealPlanner() {
  const [plan, setPlan]               = useState({});
  const [groceryCats, setGroceryCats] = useState({});
  const [checked, setChecked]         = useState({});
  const [tab, setTab]                 = useState("plan");
  const [loading, setLoading]         = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState("");
  const [aiError, setAiError]         = useState(false);
  const [savedWeeks, setSavedWeeks]   = useState({});
  const [myRecipes, setMyRecipes]     = useState([]);
  const [ratings, setRatings]         = useState({});
  const [saveName, setSaveName]       = useState("");
  const [saveModal, setSaveModal]     = useState(false);
  const [savedSheet, setSavedSheet]   = useState(false);
  const [librarySheet, setLibrarySheet] = useState(false);
  const [addModal, setAddModal]       = useState(false);
  const [viewRecipe, setViewRecipe]   = useState(null);
  const [rateModal, setRateModal]     = useState(null);
  const [swapSheet, setSwapSheet]     = useState(null); // { day, aiMode }
  const [swappingDay, setSwappingDay] = useState(null);
  const [swapSelectDay, setSwapSelectDay] = useState(null); // first day tapped for swap
  const [skippedDays, setSkippedDays] = useState({});
  const [portionSizes, setPortionSizes] = useState({}); // { Monday: 1, Tuesday: 0.5, ... }
  const [copied, setCopied]           = useState(false);
  const [toast, setToast]             = useState("");
  const [editRecipe, setEditRecipe]   = useState(null);   // meal being edited
  const [manualItems, setManualItems] = useState([]);      // manually added grocery items
  const [manualInput, setManualInput] = useState("");

  const allRecipes = [...SEED_MEALS, ...myRecipes];

  useEffect(()=>{
    const d = store.get("data") || {};
    if (d.savedWeeks) setSavedWeeks(d.savedWeeks);
    if (d.myRecipes)  setMyRecipes(d.myRecipes);
    if (d.ratings)    setRatings(d.ratings);
    generateWeek(false);
  }, []);

  const persist = (sw=savedWeeks, mr=myRecipes, rt=ratings) =>
    store.set("data", { savedWeeks:sw, myRecipes:mr, ratings:rt });

  const saveEditedRecipe = (updated) => {
    // Update in plan (any day using this recipe by id)
    const newPlan = Object.fromEntries(
      Object.entries(plan).map(([day, m]) =>
        m?.id === updated.id ? [day, updated] : [day, m]
      )
    );
    setPlan(newPlan);
    // Update in myRecipes if it lives there
    const newMR = myRecipes.map(r => r.id === updated.id ? updated : r);
    setMyRecipes(newMR);
    persist(savedWeeks, newMR);
    setEditRecipe(null);
    showToast("Recipe updated!");
  };

  // Rebuild grocery list whenever plan, skipped days, or portion sizes change
  useEffect(()=>{
    const activePlan = Object.fromEntries(
      Object.entries(plan).filter(([day]) => !skippedDays[day])
    );
    setGroceryCats(buildGroceriesWithPortions(activePlan, portionSizes));
  }, [plan, skippedDays, portionSizes]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 2500); };

  const applyPlan = (p) => {
    setPlan(p);
    setSkippedDays({});
    setPortionSizes({});
    setChecked({});
  };

  const generateWeek = async (useAI = true) => {
    setLoading(true); setAiError(false);
    setLoadingMsg(useAI ? "Asking Claude for ideas..." : "Building your week...");
    try {
      let meals;
      if (useAI) {
        const exclude = allRecipes.map(r => r.name);
        meals = await fetchAIMeals(exclude);
      } else {
        meals = shuffle(SEED_MEALS).slice(0, 7);
      }
      const p = {};
      DAYS.forEach((d, i) => { p[d] = meals[i] || shuffle([...SEED_MEALS])[i % SEED_MEALS.length]; });
      applyPlan(p);
    } catch(e) {
      setAiError(true);
      const fallback = [...shuffle(SEED_MEALS), ...shuffle(SEED_MEALS)].slice(0, 7);
      const p = {};
      DAYS.forEach((d,i) => { p[d] = fallback[i]; });
      applyPlan(p);
    }
    setLoading(false);
  };

  const swapWithAI = async (day) => {
    setSwappingDay(day);
    try {
      const exclude = Object.values(plan).map(m=>m?.name).filter(Boolean);
      const nm = await fetchSingleAIMeal(exclude);
      const newPlan = { ...plan, [day]: nm };
      applyPlan(newPlan);
      showToast(`Swapped ${day}!`);
    } catch {
      showToast("AI swap failed — try manual swap");
    }
    setSwappingDay(null);
  };

  const swapManual = (day, meal) => {
    const newPlan = { ...plan, [day]: meal };
    applyPlan(newPlan);
    showToast(`${day} updated!`);
  };

  const swapDays = (dayA, dayB) => {
    if (!dayA || !dayB || dayA === dayB) return;
    const newPlan = { ...plan, [dayA]: plan[dayB], [dayB]: plan[dayA] };
    setPortionSizes(p => ({ ...p, [dayA]: p[dayB]||1, [dayB]: p[dayA]||1 }));
    setSkippedDays(p => ({ ...p, [dayA]: p[dayB]||false, [dayB]: p[dayA]||false }));
    setPlan(newPlan);
    setChecked({});
    setSwapSelectDay(null);
    showToast(`${dayA} & ${dayB} swapped! 🔄`);
  };

  const handleDayTap = (day) => {
    if (!swapSelectDay) {
      setSwapSelectDay(day); // first tap — select this day
    } else if (swapSelectDay === day) {
      setSwapSelectDay(null); // tapped same day — deselect
    } else {
      swapDays(swapSelectDay, day); // second tap — swap!
    }
  };

  const saveWeek = () => {
    if (!saveName.trim()) return;
    const updated = { ...savedWeeks, [saveName.trim()]: { plan, savedAt: new Date().toLocaleDateString() }};
    setSavedWeeks(updated); persist(updated, myRecipes);
    setSaveModal(false); setSaveName(""); showToast(`Saved "${saveName.trim()}"`);
  };

  const loadWeek = (name) => {
    const w = savedWeeks[name]; if (!w) return;
    applyPlan(w.plan); setSavedSheet(false); setTab("plan"); showToast(`Loaded "${name}"`);
  };

  const deleteWeek = (name) => {
    const u = { ...savedWeeks }; delete u[name];
    setSavedWeeks(u); persist(u, myRecipes);
  };

  const addRecipe = (meal) => {
    const u = [...myRecipes, meal]; setMyRecipes(u); persist(savedWeeks, u, ratings);
    setAddModal(false); showToast(`Added "${meal.name}"`);
  };

  const deleteCustom = (id) => {
    const u = myRecipes.filter(m=>m.id!==id); setMyRecipes(u); persist(savedWeeks, u, ratings);
  };

  const saveRating = (draft) => {
    const u = { ...ratings, [rateModal.name]: draft };
    setRatings(u); persist(savedWeeks, myRecipes, u);
    setRateModal(null); showToast(`Rated "${rateModal.name}"`);
  };

  const avgRating = () => {
    const v = Object.values(ratings).map(r=>r.stars).filter(s=>s>0);
    return v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : null;
  };

  const allGroceries = [...Object.values(groceryCats).flat(), ...manualItems];
  const unchecked = allGroceries.filter(i=>!checked[i]).length;
  const toddlerCount = Object.values(plan).filter(m=>m?.toddlerFriendly).length;

  const NAV = [
    { id:"plan",      icon:"🗓", label:"Meals" },
    { id:"groceries", icon:"🛒", label:`Shop${allGroceries.length?` (${unchecked})`:""}`},
    { id:"library",   icon:"👨‍🍳", label:"Recipes" },
  ];

  return (
    <div style={{fontFamily:FONT,minHeight:"100vh",background:A.bg,color:A.textPrimary,maxWidth:480,margin:"0 auto",paddingBottom:76}}>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:A.teal,color:"#fff",
          padding:"10px 22px",borderRadius:30,fontSize:13,zIndex:2000,fontWeight:700,whiteSpace:"nowrap",
          boxShadow:`0 4px 24px ${A.teal}66`,pointerEvents:"none"}}>
          {toast}
        </div>
      )}

      {/* Overlays */}
      {viewRecipe&&<RecipeSheet meal={viewRecipe} onClose={()=>setViewRecipe(null)} onEdit={m=>{setEditRecipe(m);}}
        plan={plan} onAssign={(day,meal)=>{swapManual(day,meal);}}/>}
      {editRecipe&&<EditRecipeModal meal={editRecipe} onSave={saveEditedRecipe} onClose={()=>setEditRecipe(null)}/>}
      {addModal&&<AddRecipeModal onAdd={addRecipe} onClose={()=>setAddModal(false)}/>}
      {rateModal&&<RateModal meal={rateModal} existing={ratings[rateModal.name]} onSave={saveRating} onClose={()=>setRateModal(null)}/>}
      {swapSheet&&swapSheet.mode==="manual"&&(
        <ManualSwapSheet day={swapSheet.day} allRecipes={allRecipes} currentMeal={plan[swapSheet.day]}
          onSwap={m=>swapManual(swapSheet.day,m)} onClose={()=>setSwapSheet(null)}/>
      )}

      {/* Save week modal */}
      {saveModal&&(
        <Modal onClose={()=>setSaveModal(false)}>
          <div style={{padding:"20px 20px 28px"}}>
            <div style={{fontSize:19,fontWeight:700,color:A.textPrimary,marginBottom:6}}>Save This Week</div>
            <div style={{fontSize:13,color:A.textSecondary,marginBottom:16}}>Give this plan a name so you can reload it anytime.</div>
            <input value={saveName} onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveWeek()}
              placeholder='e.g. "Kids Faves", "Quick Weeknights"...' autoFocus
              style={{width:"100%",padding:"13px 14px",background:A.surface3,border:`1px solid ${A.border}`,
                borderRadius:12,fontSize:14,color:A.textPrimary,outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setSaveModal(false)} style={{flex:1,padding:13,border:`1px solid ${A.border}`,borderRadius:12,background:"transparent",cursor:"pointer",fontSize:13,color:A.textSecondary}}>Cancel</button>
              <button onClick={saveWeek} style={{flex:2,padding:13,border:"none",borderRadius:12,background:A.teal,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700}}>Save ✓</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Saved weeks sheet */}
      {savedSheet&&(
        <Sheet onClose={()=>setSavedSheet(false)} title="Saved Weeks">
          <div style={{padding:"16px 20px 32px"}}>
            {Object.keys(savedWeeks).length===0
              ?<div style={{textAlign:"center",padding:"32px 0",color:A.textMuted}}>
                <div style={{fontSize:40,marginBottom:10}}>📋</div>
                <div style={{fontSize:14}}>No saved weeks yet</div>
              </div>
              :Object.entries(savedWeeks).map(([name,data])=>(
                <div key={name} style={{background:A.surface2,borderRadius:14,padding:16,marginBottom:10,border:`1px solid ${A.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:15,color:A.textPrimary,marginBottom:2}}>{name}</div>
                      <div style={{fontSize:11,color:A.textMuted,marginBottom:6}}>Saved {data.savedAt}</div>
                      <div style={{fontSize:12,color:A.textSecondary,lineHeight:1.5}}>{Object.values(data.plan).map(m=>m?.name).filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{display:"flex",gap:8,marginLeft:12,flexShrink:0}}>
                      <button onClick={()=>loadWeek(name)} style={{background:A.teal,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:700}}>Load</button>
                      <button onClick={()=>deleteWeek(name)} style={{background:A.surface3,color:A.red,border:`1px solid ${A.red}44`,borderRadius:8,padding:"8px 10px",cursor:"pointer",fontSize:13}}>🗑</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </Sheet>
      )}



      {/* ── HEADER ── */}
      <div style={{padding:"52px 20px 20px",background:"linear-gradient(180deg,#E8EDF2 0%,#F2F4F6 100%)"}}>
        <div style={{fontSize:11,color:A.teal,letterSpacing:3,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Family Meal Planner</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontSize:28,fontWeight:300,color:A.textSecondary,lineHeight:1.1}}>This Week's</div>
            <div style={{fontSize:28,fontWeight:700,color:A.textPrimary,lineHeight:1.15}}>Menu</div>
            <div style={{fontSize:12,color:A.textSecondary,marginTop:6}}>
              2 adults · 1 toddler · 5 dinners{toddlerCount>0?` · 🐣 ${toddlerCount} toddler-friendly`:""}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setSavedSheet(true)}
              style={{background:A.surface,border:`1px solid ${A.border}`,borderRadius:12,
                padding:"8px 12px",cursor:"pointer",display:"flex",flexDirection:"column",
                alignItems:"center",gap:2,boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
              <span style={{fontSize:20}}>📅</span>
              <span style={{fontSize:9,color:A.textSecondary,fontWeight:700,letterSpacing:0.3}}>SAVED WEEKS</span>
              <span style={{fontSize:10,color:A.teal,fontWeight:700}}>{Object.keys(savedWeeks).length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:"8px 16px 24px"}}>

        {/* PLAN TAB */}
        {tab==="plan"&&(
          <>
            {loading?(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:A.tealSoft,border:`2px solid ${A.teal}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 16px"}}>🥘</div>
                <div style={{fontSize:15,color:A.teal,fontWeight:600}}>{loadingMsg}</div>
                <div style={{fontSize:12,color:A.textMuted,marginTop:6}}>Tailoring meals for your family...</div>
              </div>
            ):(
              <>
                {aiError&&(
                  <div style={{background:"#FFF8EC",border:`1px solid ${A.amber}44`,borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:12,color:A.amber}}>
                    ⚠️ AI unavailable — showing curated meals
                  </div>
                )}
                {swapSelectDay&&(
                  <div style={{background:A.tealSoft,border:`1px solid ${A.teal}44`,borderRadius:12,
                    padding:"10px 14px",marginBottom:12,fontSize:13,color:A.teal,fontWeight:600,
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>🔄 Now tap another day to swap with <strong>{swapSelectDay}</strong></span>
                    <button onClick={()=>setSwapSelectDay(null)}
                      style={{background:"transparent",border:"none",cursor:"pointer",
                        color:A.teal,fontSize:16,padding:"0 4px"}}>✕</button>
                  </div>
                )}

                {DAYS.map(day=>{
                  const meal=plan[day]; if(!meal) return null;
                  const meta=METHOD_META[meal.method]||METHOD_META.sheetpan;
                  const rating=ratings[meal.name];
                  const isSwapping=swappingDay===day;
                  const isSkipped=skippedDays[day] !== undefined && skippedDays[day] !== false;

                  // ── Skipped card ──
                  if (isSkipped) return (
                    <div key={day}
                      style={{background:A.surface2,borderRadius:18,padding:16,marginBottom:12,
                        border:`2px solid ${swapSelectDay===day?A.teal:swapSelectDay?A.teal+"44":A.border}`,
                        boxShadow:swapSelectDay===day?`0 0 0 3px ${A.teal}33`:"0 1px 4px rgba(0,0,0,0.05)",
                        opacity:swapSelectDay&&swapSelectDay!==day?0.7:1,
                        transition:"all 0.15s",cursor:swapSelectDay?"pointer":"default"}}
                      onClick={()=>swapSelectDay&&swapSelectDay!==day&&handleDayTap(day)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                        <div style={{fontSize:10,color:A.textMuted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>{day}</div>
                        <button onClick={()=>setSkippedDays(p=>({...p,[day]:false}))}
                          style={{background:"transparent",border:"none",padding:"2px 6px",
                            cursor:"pointer",fontSize:11,color:A.teal,fontWeight:600}}>
                          ↩ Restore
                        </button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22,flexShrink:0}}>🥡</span>
                        <input
                          value={skippedDays[day] || ""}
                          onChange={e=>setSkippedDays(p=>({...p,[day]:e.target.value}))}
                          placeholder="What are you ordering? (e.g. Hai Chinese)"
                          style={{flex:1,background:A.surface,border:`1px solid ${A.border}`,borderRadius:10,
                            padding:"9px 12px",fontSize:13,color:A.textPrimary,outline:"none",
                            fontFamily:"inherit"}}
                        />
                      </div>
                    </div>
                  );

                  // ── Normal card ──
                  const portion = portionSizes[day] || 1;
                  const baseServings = Number(meal.servings) || 4;
                  const scaledServings = Math.round(baseServings * portion);
                  return(
                    <div key={day}
                      style={{background:A.surface,borderRadius:18,padding:16,marginBottom:12,
                        border:`2px solid ${swapSelectDay===day?A.teal:swapSelectDay?A.teal+"55":A.border}`,
                        boxShadow:swapSelectDay===day?`0 0 0 3px ${A.teal}33`:"0 1px 4px rgba(0,0,0,0.07)",
                        opacity:isSwapping?.4:swapSelectDay&&swapSelectDay!==day?0.7:1,
                        transition:"all 0.15s"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <div style={{fontSize:10,color:A.textMuted,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>{day}</div>
                        <button onClick={()=>handleDayTap(day)}
                          style={{background:swapSelectDay===day?A.teal:A.surface3,
                            border:`1px solid ${swapSelectDay===day?A.teal:A.border}`,
                            borderRadius:8,padding:"3px 10px",cursor:"pointer",
                            fontSize:11,fontWeight:700,
                            color:swapSelectDay===day?"#fff":A.textMuted,
                            transition:"all 0.15s"}}>
                          {swapSelectDay===day?"✓ Selected":"⇅ Swap"}
                        </button>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1,cursor:"pointer",paddingRight:8}} onClick={()=>setViewRecipe(meal)}>

                          <div style={{fontSize:16,fontWeight:700,color:A.textPrimary,lineHeight:1.3,marginBottom:8}}>{meal.name}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                            <Pill color={meta.color} bg={meta.bg}>{meta.emoji} {meta.label}</Pill>
                            {meal.toddlerFriendly&&<Pill color={A.amber} bg="#FFF8E6">🐣</Pill>}
                            {meal.cookTime&&<Pill color={A.textMuted} bg={A.surface3}>⏱ {meal.cookTime}</Pill>}
                            {rating?.stars>0
                              ?<span style={{fontSize:12,color:A.amber}}>{"⭐".repeat(rating.stars)}</span>
                              :<span style={{fontSize:11,color:A.textMuted}}>Tap for recipe</span>}
                          </div>
                        </div>
                        {/* Action column */}
                        <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                          <button onClick={()=>swapWithAI(day)} disabled={!!swappingDay}
                            style={{background:A.surface3,border:`1px solid ${A.border}`,borderRadius:8,padding:"6px 11px",
                              cursor:"pointer",fontSize:11,color:A.teal,fontWeight:600,
                              opacity:swappingDay&&!isSwapping?.4:1,whiteSpace:"nowrap"}}>
                            {isSwapping?"...":"✨ AI Swap"}
                          </button>
                          <button onClick={()=>setSwapSheet({day,mode:"manual"})} disabled={!!swappingDay}
                            style={{background:A.surface3,border:`1px solid ${A.border}`,borderRadius:8,padding:"6px 11px",
                              cursor:"pointer",fontSize:11,color:A.textSecondary,fontWeight:600,whiteSpace:"nowrap"}}>
                            ☰ Pick
                          </button>

                          <button onClick={()=>setSkippedDays(p=>({...p,[day]:""}))}
                            style={{background:"transparent",border:`1px solid ${A.border}`,borderRadius:8,padding:"6px 11px",
                              cursor:"pointer",fontSize:11,color:A.textMuted,fontWeight:500,whiteSpace:"nowrap"}}>
                            🥡 Skip
                          </button>
                        </div>
                      </div>
                      {/* Portion selector row */}
                      <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${A.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:12,color:A.textSecondary}}>
                          Portions: <strong style={{color:A.textPrimary}}>{scaledServings} servings</strong>
                        </div>
                        <div style={{display:"flex",gap:0,background:A.surface3,borderRadius:8,padding:2}}>
                          {[["½x",0.5],["1x",1],["2x",2]].map(([lbl,val])=>(
                            <button key={val} onClick={()=>setPortionSizes(p=>({...p,[day]:val}))}
                              style={{padding:"4px 12px",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,
                                background:portion===val?A.teal:A.surface3,
                                color:portion===val?"#fff":A.textMuted,transition:"all 0.15s"}}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Inline rating row */}
                      <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${A.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div style={{fontSize:12,color:A.textSecondary,fontWeight:500}}>
                          {rating?.stars>0
                            ? <span style={{color:A.amber}}>{"⭐".repeat(rating.stars)}{rating.note&&<span style={{color:A.textMuted,fontSize:11,fontStyle:"italic",marginLeft:6}}>"{rating.note.slice(0,30)}{rating.note.length>30?"…":""}"</span>}</span>
                            : <span style={{color:A.textMuted}}>No rating yet</span>
                          }
                        </div>
                        <button onClick={()=>setRateModal(meal)}
                          style={{background:rating?.stars>0?A.tealSoft:A.surface3,
                            border:`1px solid ${rating?.stars>0?A.teal:A.border}`,
                            borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:11,
                            color:rating?.stars>0?A.teal:A.textSecondary,fontWeight:600}}>
                          {rating?.stars>0?"✏️ Edit Rating":"☆ Rate"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button onClick={()=>generateWeek(true)}
                  style={{width:"100%",padding:16,background:A.teal,color:"#fff",border:"none",borderRadius:14,
                    cursor:"pointer",fontSize:15,fontWeight:700,marginBottom:10,
                    boxShadow:`0 4px 20px ${A.teal}44`}}>
                  ✨ Generate New AI Plan
                </button>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>setSaveModal(true)} style={{padding:13,background:A.surface,border:`1px solid ${A.border}`,borderRadius:12,cursor:"pointer",fontSize:13,color:A.textPrimary,fontWeight:600,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>💾 Save Week</button>
                  <button onClick={()=>setTab("groceries")} style={{padding:13,background:A.surface,border:`1px solid ${A.border}`,borderRadius:12,cursor:"pointer",fontSize:13,color:A.textPrimary,fontWeight:600,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>🛒 View List</button>
                </div>
              </>
            )}
          </>
        )}

        {/* GROCERY TAB */}
        {tab==="groceries"&&(
          <>
            <div style={{background:A.surface,borderRadius:16,padding:18,marginBottom:14,border:`1px solid ${A.border}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,color:A.textPrimary}}>Publix · Instacart</div>
                  <div style={{fontSize:12,color:A.textSecondary,marginTop:2}}>{allGroceries.length} items · {unchecked} remaining</div>
                </div>
                <button onClick={()=>{
                  const lines = Object.entries(groceryCats).map(([cat,items])=>`${cat}\n${items.map(i=>`• ${i}`).join("\n")}`).join("\n\n");
                  navigator.clipboard?.writeText("🛒 GROCERY LIST\n\n"+lines);
                  setCopied(true); setTimeout(()=>setCopied(false),2000);
                }} style={{background:copied?A.teal:A.surface3,color:copied?"#000":A.textSecondary,border:"none",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.2s"}}>
                  {copied?"✓ Copied":"📋 Copy"}
                </button>
              </div>
              <div style={{marginTop:12,padding:"10px 14px",background:A.tealSoft,borderRadius:10,fontSize:12,color:A.tealDark,fontWeight:500}}>
                💡 Copy → open Instacart → paste into notes or cart
              </div>
            </div>

            {/* Grouped list */}
            {Object.entries(groceryCats).map(([cat, items])=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontSize:11,color:A.textSecondary,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:8,paddingLeft:2}}>
                  {cat}
                </div>
                {items.map(item=>(
                  <div key={item} onClick={()=>setChecked(p=>({...p,[item]:!p[item]}))}
                    style={{display:"flex",alignItems:"center",padding:"12px 16px",marginBottom:5,
                      background:checked[item]?A.surface3:A.surface,borderRadius:12,cursor:"pointer",
                      border:`1px solid ${checked[item]?A.border:A.borderBright}`,opacity:checked[item]?.5:1,
                      boxShadow:checked[item]?"none":"0 1px 3px rgba(0,0,0,0.05)",transition:"all 0.15s"}}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${checked[item]?A.teal:A.border}`,
                      background:checked[item]?A.teal:"transparent",marginRight:12,flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                      {checked[item]&&<span style={{color:"#000",fontSize:13,fontWeight:800}}>✓</span>}
                    </div>
                    <span style={{fontSize:14,textDecoration:checked[item]?"line-through":"none",color:checked[item]?A.textMuted:A.textPrimary}}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
            {/* Manual add section */}
            <div style={{marginBottom:16,background:A.surface,borderRadius:14,padding:16,border:`1px solid ${A.border}`}}>
              <div style={{fontSize:11,color:A.textSecondary,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>➕ Add Item</div>
              <div style={{display:"flex",gap:8}}>
                <input
                  value={manualInput}
                  onChange={e=>setManualInput(e.target.value)}
                  onKeyDown={e=>{
                    if (e.key==="Enter" && manualInput.trim()) {
                      setManualItems(p=>[...p, manualInput.trim()]);
                      setManualInput("");
                    }
                  }}
                  placeholder="e.g. 2 avocados, sparkling water..."
                  style={{flex:1,background:A.surface3,border:`1px solid ${A.border}`,borderRadius:10,
                    padding:"10px 14px",fontSize:13,color:A.textPrimary,outline:"none",fontFamily:"inherit"}}
                />
                <button onClick={()=>{
                  if (!manualInput.trim()) return;
                  setManualItems(p=>[...p, manualInput.trim()]);
                  setManualInput("");
                }}
                  style={{background:A.teal,color:"#fff",border:"none",borderRadius:10,padding:"10px 16px",
                    cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0}}>
                  Add
                </button>
              </div>
              {manualItems.length>0&&(
                <div style={{marginTop:10}}>
                  {manualItems.map((item,i)=>(
                    <div key={i} onClick={()=>setChecked(p=>({...p,[item]:!p[item]}))}
                      style={{display:"flex",alignItems:"center",padding:"10px 12px",marginBottom:4,
                        background:checked[item]?A.surface3:A.surface2,borderRadius:10,cursor:"pointer",
                        border:`1px solid ${checked[item]?A.border:A.borderBright}`,opacity:checked[item]?.5:1,
                        transition:"all 0.15s"}}>
                      <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${checked[item]?A.teal:A.border}`,
                        background:checked[item]?A.teal:"transparent",marginRight:10,flexShrink:0,
                        display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                        {checked[item]&&<span style={{color:"#fff",fontSize:11,fontWeight:800}}>✓</span>}
                      </div>
                      <span style={{flex:1,fontSize:13,color:checked[item]?A.textMuted:A.textPrimary,
                        textDecoration:checked[item]?"line-through":"none"}}>{item}</span>
                      <button onClick={e=>{e.stopPropagation();setManualItems(p=>p.filter((_,j)=>j!==i));}}
                        style={{background:"transparent",border:"none",cursor:"pointer",color:A.textMuted,
                          fontSize:16,padding:"0 4px",lineHeight:1}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={()=>{setChecked({});setManualItems([]);}} style={{width:"100%",marginTop:4,background:"transparent",border:`1px solid ${A.border}`,padding:13,borderRadius:12,cursor:"pointer",fontSize:13,color:A.textSecondary}}>↺ Reset All</button>
          </>
        )}

        {/* LIBRARY TAB */}
        {/* LIBRARY TAB */}
        {tab==="library"&&(
          <>
            <button onClick={()=>setAddModal(true)}
              style={{width:"100%",padding:14,background:A.teal,color:"#fff",border:"none",borderRadius:14,
                cursor:"pointer",fontSize:14,fontWeight:700,marginBottom:14}}>
              + Add Recipe (Link or Photo)
            </button>
            <div style={{fontSize:11,color:A.textMuted,marginBottom:12,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>{allRecipes.length} Recipes</div>
            {allRecipes.map(meal=>{
              const meta=METHOD_META[meal.method]||METHOD_META.sheetpan;
              return(
                <div key={meal.id} style={{background:A.surface,borderRadius:14,padding:"14px 16px",marginBottom:8,border:`1px solid ${A.border}`,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>setViewRecipe(meal)}>
                      <div style={{fontWeight:600,fontSize:14,color:A.textPrimary,marginBottom:6,lineHeight:1.3}}>{meal.name}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        <Pill color={meta.color} bg={meta.bg}>{meta.emoji} {meta.label}</Pill>
                        {meal.toddlerFriendly&&<Pill color={A.amber} bg="#FFF8E6">🐣</Pill>}
                        {meal.source==="custom"&&<Pill color={A.teal} bg={A.tealSoft}>🔗</Pill>}
                        {meal.cookTime&&<Pill color={A.textMuted} bg={A.surface3}>⏱ {meal.cookTime}</Pill>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5,marginLeft:12}}>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap",maxWidth:160,justifyContent:"flex-end"}}>
                        {DAYS.map(d=>{
                          const isAssigned = plan[d]?.id === meal.id;
                          return (
                          <button key={d} onClick={()=>swapManual(d,meal)}
                            title={isAssigned ? `Assigned to ${d}` : `Assign to ${d}`}
                            style={{background:isAssigned?A.teal:A.surface3,
                              color:isAssigned?"#fff":A.textMuted,
                              border:`1px solid ${isAssigned?A.teal:A.border}`,
                              borderRadius:4,padding:"3px 5px",cursor:"pointer",
                              fontSize:9,fontWeight:700,lineHeight:1.2,transition:"all 0.15s"}}>
                            {d.slice(0,2)}
                          </button>
                        )})}
                      </div>
                      {meal.source!=="builtin"&&(
                        <button onClick={()=>deleteCustom(meal.id)}
                          style={{background:A.surface3,color:A.red,border:`1px solid ${A.red}44`,
                            borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11}}>
                          🗑 Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}


      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,
        background:A.surface,borderTop:`1px solid ${A.border}`,display:"flex",zIndex:500,
        paddingBottom:"env(safe-area-inset-bottom,0)",boxShadow:"0 -2px 12px rgba(0,0,0,0.08)"}}>
        {NAV.map(({id,icon,label})=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1,padding:"10px 6px 12px",border:"none",background:"transparent",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:22}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:tab===id?700:400,color:tab===id?A.teal:A.textMuted,letterSpacing:0.3}}>{label}</span>
            {tab===id&&<div style={{width:24,height:3,background:A.teal,borderRadius:2,marginTop:2}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}
