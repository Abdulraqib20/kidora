/** Generate studio-style product catalogue images using the Gemini image API into public/products/. */
import "dotenv/config";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { GoogleGenAI } from "@google/genai";

const run = promisify(execFile);
const OUT_DIR = path.resolve("public/products");

const STYLE =
  "Professional e-commerce product photograph. Single product only, centered composition, on a seamless plain light warm-gray studio background, soft diffused studio lighting, subtle soft shadow beneath the product, crisp focus, high detail, commercial catalogue style. No people, no text, no logos, no watermarks.";

const products = [
  ["floral-gown", "a baby girl's pink floral cotton dress with frilled sleeves, neatly displayed"],
  ["cartoon-set", "a baby boy's blue two-piece outfit set with cartoon print, folded neatly"],
  ["cotton-romper", "a cream unisex baby romper with snap buttons"],
  ["denim-overalls", "a toddler's blue denim overalls with adjustable straps"],
  ["tutu-dress", "a baby girl's pink layered tulle tutu party dress with satin bodice"],
  ["hoodie-set", "a grey baby hoodie with matching fleece pants, folded as a set"],
  ["sleepsuit", "three pastel-colored baby sleepsuits folded in a neat stack"],
  ["christening", "a white baby christening gown set with a matching cap"],
  ["canvas-slipon", "a pair of navy kids' canvas slip-on shoes"],
  ["lightup-sneaker", "a pair of kids' white sneakers with colorful light-up LED soles"],
  ["sports-cleats", "a pair of kids' blue football cleats soccer boots"],
  ["sparkle-flats", "a pair of girls' silver glitter party flats with ankle strap"],
  ["kids-sandals", "a pair of kids' navy blue velcro strap sandals"],
  ["air-runner", "a pair of modern white and black cushioned running sneakers"],
  ["leather-loafer", "a pair of brown polished leather loafers"],
  ["high-tops", "a pair of black canvas high-top sneakers"],
  ["chelsea-boots", "a pair of brown suede chelsea boots"],
  ["block-heels", "a pair of black women's block heel shoes"],
  ["leather-sandals", "a pair of men's brown leather slide sandals"],
  ["ankara-headwrap", "a colorful African ankara print headwrap elegantly tied"],
  ["pram-blanket", "a mint green fleece baby blanket neatly folded"],
  ["kids-backpack", "a blue kids' school backpack with padded straps"],
  ["lunch-box", "a mint two-tier kids' lunch box with carry strap"],
  ["pacifier-clip", "a set of two pastel silicone baby pacifier clips"],
  ["kids-sunglasses", "a pair of kids' black UV protection sunglasses"],
  ["hair-bows", "six assorted satin hair bows on clips arranged neatly"],
  ["stacking-blocks", "a set of colorful wooden stacking alphabet blocks"],
  ["teddy-bear", "a soft cream plush teddy bear sitting upright"],
  ["scooter", "a kids' blue three-wheel kick scooter with light-up wheels"],
  ["flashcards", "a set of illustrated alphabet learning flash cards fanned out"],
];


const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT || "bujeti-ai",
  location: process.env.GOOGLE_CLOUD_LOCATION || "global",
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Request AI image generation with automatic retry backoff on rate limits or errors. */
async function generate(slug, subject) {

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: `${STYLE} Subject: ${subject}.`,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "1:1" },
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p) => p.inlineData || p.inline_data);
      if (!imgPart) throw new Error("no image part in response");
      const inline = imgPart.inlineData ?? imgPart.inline_data;
      return Buffer.from(inline.data, "base64");
    } catch (e) {
      const retryable = /429|5\d\d|rate|overload/i.test(e.message ?? "");
      if (!retryable || attempt === 4) throw e;
      await sleep(6000 * attempt);
    }
  }
}

let ok = 0;
for (const [slug, subject] of products) {
  const dest = path.join(OUT_DIR, `${slug}.jpg`);
  if (fs.existsSync(dest)) {
    console.log(`= ${slug}: exists, skipping`);
    ok++;
    continue;
  }
  try {
    const tmp = path.join(OUT_DIR, `.${slug}.tmp.jpg`);
    fs.writeFileSync(tmp, await generate(slug, subject));
    // Normalize to 800px JPEG via macOS sips.
    await run("sips", ["-Z", "800", "--setProperty", "format", "jpeg", "--setProperty", "formatOptions", "85", tmp, "--out", dest]);
    fs.unlinkSync(tmp);
    console.log(`✓ ${slug}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${slug}: ${(e.message ?? e).toString().slice(0, 120)}`);
  }
  await sleep(1500);
}

console.log(`\nDone: ${ok}/${products.length} images.`);
if (ok === products.length) {
  console.log("Next: switch seed image paths to .jpg and run `npm run db:seed`.");
}
