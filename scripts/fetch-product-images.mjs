// Fetches one commercially-licensed stock photo per product from Openverse
// (https://api.openverse.org) into public/products/<slug>.jpg.
// Usage: node scripts/fetch-product-images.mjs
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("public/products");
const CREDITS_FILE = path.join(OUT_DIR, "CREDITS.txt");

const products = [
  { slug: "floral-gown", q: "baby girl dress floral" },
  { slug: "cartoon-set", q: "baby boy clothes outfit" },
  { slug: "cotton-romper", q: "baby romper" },
  { slug: "denim-overalls", q: "toddler denim overalls" },
  { slug: "tutu-dress", q: "tutu skirt pink" },
  { slug: "hoodie-set", q: "baby hoodie" },
  { slug: "sleepsuit", q: "baby onesie" },
  { slug: "christening", q: "baby christening gown" },
  { slug: "canvas-slipon", q: "canvas slip on shoes" },
  { slug: "lightup-sneaker", q: "kids sneakers shoes" },
  { slug: "sports-cleats", q: "football boots soccer" },
  { slug: "sparkle-flats", q: "girls party shoes" },
  { slug: "kids-sandals", q: "kids sandals" },
  { slug: "air-runner", q: "running sneakers" },
  { slug: "leather-loafer", q: "leather loafers shoes" },
  { slug: "high-tops", q: "high top canvas sneakers" },
  { slug: "chelsea-boots", q: "chelsea boots" },
  { slug: "block-heels", q: "women heel shoes" },
  { slug: "leather-sandals", q: "leather sandals" },
  { slug: "ankara-headwrap", q: "african print fabric colorful" },
  { slug: "pram-blanket", q: "baby blanket" },
  { slug: "kids-backpack", q: "school backpack" },
  { slug: "lunch-box", q: "lunch box" },
  { slug: "pacifier-clip", q: "baby pacifier" },
  { slug: "kids-sunglasses", q: "kids sunglasses" },
  { slug: "hair-bows", q: "hair bow ribbon" },
  { slug: "stacking-blocks", q: "wooden building blocks toy" },
  { slug: "teddy-bear", q: "teddy bear plush" },
  { slug: "scooter", q: "kick scooter" },
  { slug: "flashcards", q: "flash cards education" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&license_type=commercial&size=medium,large`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "kidora-demo/1.0" } });
    if (res.status === 429 || res.status >= 500) {
      await sleep(4000 * attempt);
      continue;
    }
    if (!res.ok) throw new Error(`search ${res.status}`);
    return (await res.json()).results ?? [];
  }
  throw new Error("search rate-limited");
}

// Prefer reasonably square, decent-resolution shots.
function pickBest(results) {
  const usable = results.filter(
    (r) => (r.width ?? 0) >= 500 && (r.height ?? 0) >= 400 && /^https?:/.test(r.url ?? ""),
  );
  const scored = usable
    .map((r) => ({ r, squareness: -Math.abs((r.width / (r.height || 1)) - 1) }))
    .sort((a, b) => b.squareness - a.squareness);
  return scored[0]?.r ?? null;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "kidora-demo/1.0" } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20_000) throw new Error("image too small, likely error page");
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const credits = ["Product photo credits (Openverse / openly-licensed sources):", ""];
let ok = 0;

for (const { slug, q } of products) {
  const dest = path.join(OUT_DIR, `${slug}.jpg`);
  if (fs.existsSync(dest)) {
    console.log(`= ${slug}: already downloaded`);
    ok++;
    continue;
  }
  try {
    const best = pickBest(await search(q));
    if (!best) throw new Error("no candidate");
    const bytes = await download(best.url, dest);
    credits.push(
      `${slug}.jpg — “${(best.title || "untitled").replace(/\s+/g, " ").trim()}” by ${best.creator || "unknown"} — ${best.license} ${best.license_version ?? ""} — ${best.foreign_landing_url || best.url}`,
    );
    console.log(`✓ ${slug}: ${bytes} bytes (${best.width}x${best.height}, ${best.license})`);
    ok++;
  } catch (e) {
    console.log(`✗ ${slug}: ${e.message} — keeping SVG placeholder`);
  }
  await sleep(1500);
}

fs.writeFileSync(CREDITS_FILE, credits.join("\n") + "\n");
console.log(`\nDone: ${ok}/${products.length} downloaded. Credits in ${CREDITS_FILE}`);
