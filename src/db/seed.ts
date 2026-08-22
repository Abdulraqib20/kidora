import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db, pool, schema } from "./index";
import { auth } from "../lib/auth";

const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d;
};

/** Seed database with size categories, initial catalogue, variant stock, orders, and admin. */
async function main() {
  console.log("Clearing existing data…");
  await db.execute(
    sql`TRUNCATE order_items, orders, customers, variants, products, size_options, verification, account, session, "user" RESTART IDENTITY CASCADE`,
  );


  /* ── Size systems (admin-editable at runtime) ── */
  console.log("Seeding size options…");
  const sizeRows = await db
    .insert(schema.sizeOptions)
    .values([
      ...["0-6 months", "6-12 months", "12-18 months", "18-24 months", "24-36 months"].map(
        (label, i) => ({ label, category: "age_range", sortOrder: i + 1 }),
      ),
      ...["28", "30", "32", "34"].map((label, i) => ({
        label,
        category: "kids_shoe_size",
        sortOrder: i + 1,
      })),
      ...["39", "40", "41", "42", "43", "44", "45"].map((label, i) => ({
        label,
        category: "shoe_size",
        sortOrder: i + 1,
      })),
      { label: "One Size", category: "free_size", sortOrder: 1 },
    ])
    .returning();

  const sizeId = (label: string) => sizeRows.find((s) => s.label === label)!.id;

  /* ── Products + variants ── */
  console.log("Seeding products and variants…");

  type VariantSeed = {
    sizeLabel: string;
    color?: string;
    price: number;
    qty: number;
    restockedDaysAgo: number;
    notes?: string;
  };
  type ProductSeed = {
    name: string;
    category: string;
    brand: string;
    description: string;
    image: string;
    serialPrefix: string;
    variants: VariantSeed[];
  };

  const products: ProductSeed[] = [
    {
      name: "Baby Girl Floral Gown",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description:
        "Soft cotton floral gown with frilled sleeves. Gentle on newborn skin, easy to wash.",
      image: "/products/floral-gown.jpg",
      serialPrefix: "KLAG-101",
      variants: [
        { sizeLabel: "0-6 months", color: "Pink", price: 8500, qty: 14, restockedDaysAgo: 21 },
        { sizeLabel: "6-12 months", color: "Pink", price: 8500, qty: 9, restockedDaysAgo: 21 },
        { sizeLabel: "12-18 months", color: "Yellow", price: 8800, qty: 4, restockedDaysAgo: 75, notes: "Last packs of this print" },
        { sizeLabel: "18-24 months", color: "Yellow", price: 8800, qty: 11, restockedDaysAgo: 75 },
        { sizeLabel: "24-36 months", color: "Pink", price: 9200, qty: 7, restockedDaysAgo: 40 },
      ],
    },
    {
      name: "Baby Boy Cartoon 2-Piece Set",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Top and shorts set with cartoon print. Breathable fabric for everyday wear.",
      image: "/products/cartoon-set.jpg",
      serialPrefix: "KLBC-102",
      variants: [
        { sizeLabel: "0-6 months", color: "Blue", price: 9500, qty: 12, restockedDaysAgo: 18 },
        { sizeLabel: "6-12 months", color: "Blue", price: 9500, qty: 8, restockedDaysAgo: 18 },
        { sizeLabel: "12-18 months", color: "Green", price: 9800, qty: 6, restockedDaysAgo: 18 },
        { sizeLabel: "18-24 months", color: "Green", price: 9800, qty: 3, restockedDaysAgo: 82, notes: "Sells fast — restock soon" },
        { sizeLabel: "24-36 months", color: "Blue", price: 10200, qty: 10, restockedDaysAgo: 18 },
      ],
    },
    {
      name: "Infant Cotton Romper (Unisex)",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Snap-button romper in 100% cotton. Unisex colours, ideal gift item.",
      image: "/products/cotton-romper.jpg",
      serialPrefix: "KLIR-103",
      variants: [
        { sizeLabel: "0-6 months", color: "Cream", price: 7000, qty: 20, restockedDaysAgo: 12 },
        { sizeLabel: "6-12 months", color: "Grey", price: 7000, qty: 15, restockedDaysAgo: 12 },
        { sizeLabel: "12-18 months", color: "Cream", price: 7500, qty: 2, restockedDaysAgo: 95, notes: "Old stock from March" },
      ],
    },
    {
      name: "Toddler Denim Overalls",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Adjustable-strap denim overalls with front pocket. Durable and cute.",
      image: "/products/denim-overalls.jpg",
      serialPrefix: "KLTO-104",
      variants: [
        { sizeLabel: "12-18 months", price: 12500, qty: 6, restockedDaysAgo: 30 },
        { sizeLabel: "18-24 months", price: 12500, qty: 5, restockedDaysAgo: 30 },
        { sizeLabel: "24-36 months", price: 13000, qty: 8, restockedDaysAgo: 30 },
      ],
    },
    {
      name: "Baby Girl Tutu Party Dress",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Layered tulle party dress with satin bodice. For birthdays and owambe.",
      image: "/products/tutu-dress.jpg",
      serialPrefix: "KLTD-105",
      variants: [
        { sizeLabel: "0-6 months", color: "Pink", price: 14000, qty: 6, restockedDaysAgo: 18 },
        { sizeLabel: "6-12 months", color: "Pink", price: 14000, qty: 5, restockedDaysAgo: 18 },
        { sizeLabel: "12-18 months", color: "Lavender", price: 15000, qty: 3, restockedDaysAgo: 70, notes: "Limited sizes left" },
        { sizeLabel: "18-24 months", color: "Lavender", price: 15000, qty: 4, restockedDaysAgo: 70 },
        { sizeLabel: "24-36 months", color: "Pink", price: 15500, qty: 5, restockedDaysAgo: 42 },
      ],
    },
    {
      name: "Unisex Baby Hoodie & Pants Set",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Cosy fleece hoodie with matching pants. Unisex colours for cool evenings.",
      image: "/products/hoodie-set.jpg",
      serialPrefix: "KLHS-106",
      variants: [
        { sizeLabel: "0-6 months", color: "Grey", price: 11500, qty: 8, restockedDaysAgo: 25 },
        { sizeLabel: "6-12 months", color: "Grey", price: 11500, qty: 7, restockedDaysAgo: 25 },
        { sizeLabel: "6-12 months", color: "Mustard", price: 11500, qty: 4, restockedDaysAgo: 88 },
        { sizeLabel: "12-18 months", color: "Grey", price: 12000, qty: 6, restockedDaysAgo: 25 },
        { sizeLabel: "18-24 months", color: "Mustard", price: 12000, qty: 5, restockedDaysAgo: 88 },
      ],
    },
    {
      name: "Baby Sleepsuit 3-Pack",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "Three soft cotton sleepsuits with snap buttons. Everyday value pack.",
      image: "/products/sleepsuit.jpg",
      serialPrefix: "KLSS-107",
      variants: [
        { sizeLabel: "0-6 months", color: "Mixed", price: 16000, qty: 10, restockedDaysAgo: 14 },
        { sizeLabel: "6-12 months", color: "Mixed", price: 16000, qty: 12, restockedDaysAgo: 14 },
        { sizeLabel: "12-18 months", color: "Mixed", price: 16500, qty: 8, restockedDaysAgo: 14 },
      ],
    },
    {
      name: "Christening Outfit (Boy)",
      category: "Baby Clothing",
      brand: "Kiddie Lane",
      description: "White christening gown set with matching cap. Premium finish.",
      image: "/products/christening.jpg",
      serialPrefix: "KLCO-108",
      variants: [
        { sizeLabel: "0-6 months", color: "White", price: 22000, qty: 3, restockedDaysAgo: 55, notes: "Made to order — 2 week lead time" },
        { sizeLabel: "6-12 months", color: "White", price: 22000, qty: 2, restockedDaysAgo: 55 },
      ],
    },
    {
      name: "Kids Canvas Slip-On",
      category: "Kids Shoes",
      brand: "Skipers",
      description: "Easy-wear canvas slip-ons with rubber sole. Machine washable.",
      image: "/products/canvas-slipon.jpg",
      serialPrefix: "SKCS-205",
      variants: [
        { sizeLabel: "28", color: "Navy", price: 15000, qty: 9, restockedDaysAgo: 25 },
        { sizeLabel: "30", color: "Navy", price: 15000, qty: 11, restockedDaysAgo: 25 },
        { sizeLabel: "30", color: "Red", price: 14500, qty: 4, restockedDaysAgo: 68 },
        { sizeLabel: "32", color: "Navy", price: 15500, qty: 7, restockedDaysAgo: 25 },
        { sizeLabel: "34", color: "Red", price: 15500, qty: 6, restockedDaysAgo: 68 },
      ],
    },
    {
      name: "Kids Light-Up Sneakers",
      category: "Kids Shoes",
      brand: "GlowStep",
      description: "LED light-up sneakers with hook-and-loop strap. Kids' favourite.",
      image: "/products/lightup-sneaker.jpg",
      serialPrefix: "GSKL-206",
      variants: [
        { sizeLabel: "28", color: "Silver", price: 18000, qty: 5, restockedDaysAgo: 15 },
        { sizeLabel: "30", color: "Silver", price: 18000, qty: 8, restockedDaysAgo: 15 },
        { sizeLabel: "32", color: "Black", price: 18500, qty: 10, restockedDaysAgo: 15 },
        { sizeLabel: "34", color: "Black", price: 18500, qty: 6, restockedDaysAgo: 15 },
      ],
    },
    {
      name: "Kids Sports Cleats",
      category: "Kids Shoes",
      brand: "Skipers",
      description: "Firm-ground cleats for young footballers. Padded ankle collar.",
      image: "/products/sports-cleats.jpg",
      serialPrefix: "SKCT-207",
      variants: [
        { sizeLabel: "28", color: "Blue", price: 17500, qty: 5, restockedDaysAgo: 30 },
        { sizeLabel: "30", color: "Blue", price: 17500, qty: 6, restockedDaysAgo: 30 },
        { sizeLabel: "32", color: "Black", price: 18000, qty: 4, restockedDaysAgo: 30 },
        { sizeLabel: "34", color: "Black", price: 18000, qty: 5, restockedDaysAgo: 30 },
      ],
    },
    {
      name: "Girls Sparkle Party Flats",
      category: "Kids Shoes",
      brand: "GlowStep",
      description: "Glittery flats with ankle strap. Party-ready and comfortable.",
      image: "/products/sparkle-flats.jpg",
      serialPrefix: "GSPF-208",
      variants: [
        { sizeLabel: "28", color: "Silver", price: 13000, qty: 6, restockedDaysAgo: 48 },
        { sizeLabel: "30", color: "Silver", price: 13000, qty: 5, restockedDaysAgo: 48 },
        { sizeLabel: "30", color: "Gold", price: 13000, qty: 3, restockedDaysAgo: 95 },
        { sizeLabel: "32", color: "Gold", price: 13000, qty: 4, restockedDaysAgo: 95 },
      ],
    },
    {
      name: "Kids Velcro Sandals",
      category: "Kids Shoes",
      brand: "Skipers",
      description: "Breathable sandals with easy velcro straps. Perfect for the heat.",
      image: "/products/kids-sandals.jpg",
      serialPrefix: "SKSD-209",
      variants: [
        { sizeLabel: "28", color: "Navy", price: 9500, qty: 9, restockedDaysAgo: 20 },
        { sizeLabel: "30", color: "Navy", price: 9500, qty: 8, restockedDaysAgo: 20 },
        { sizeLabel: "32", color: "Brown", price: 9800, qty: 6, restockedDaysAgo: 20 },
        { sizeLabel: "34", color: "Brown", price: 9800, qty: 5, restockedDaysAgo: 20 },
      ],
    },
    {
      name: "Air Runner Sneakers",
      category: "Footwear",
      brand: "Striide",
      description: "Cushioned everyday running sneakers. Original quality, full size run.",
      image: "/products/air-runner.jpg",
      serialPrefix: "STAR-301",
      variants: [
        { sizeLabel: "39", color: "White", price: 45000, qty: 6, restockedDaysAgo: 20 },
        { sizeLabel: "40", color: "White", price: 45000, qty: 8, restockedDaysAgo: 20 },
        { sizeLabel: "41", color: "Black", price: 45000, qty: 10, restockedDaysAgo: 20 },
        { sizeLabel: "42", color: "Black", price: 45000, qty: 12, restockedDaysAgo: 20 },
        { sizeLabel: "42", color: "White", price: 46500, qty: 3, restockedDaysAgo: 61 },
        { sizeLabel: "43", color: "Black", price: 47000, qty: 7, restockedDaysAgo: 20 },
        { sizeLabel: "44", color: "Black", price: 47000, qty: 5, restockedDaysAgo: 20 },
        { sizeLabel: "45", color: "Black", price: 47500, qty: 2, restockedDaysAgo: 88, notes: "Slow mover" },
      ],
    },
    {
      name: "Classic Leather Loafers",
      category: "Footwear",
      brand: "Raven",
      description: "Polished leather loafers for office and occasions. True to size.",
      image: "/products/leather-loafer.jpg",
      serialPrefix: "RVCL-302",
      variants: [
        { sizeLabel: "39", color: "Brown", price: 38000, qty: 4, restockedDaysAgo: 35 },
        { sizeLabel: "40", color: "Brown", price: 38000, qty: 6, restockedDaysAgo: 35 },
        { sizeLabel: "41", color: "Black", price: 38000, qty: 7, restockedDaysAgo: 35 },
        { sizeLabel: "42", color: "Black", price: 38000, qty: 9, restockedDaysAgo: 35 },
        { sizeLabel: "43", color: "Black", price: 39500, qty: 3, restockedDaysAgo: 72 },
        { sizeLabel: "44", color: "Brown", price: 39500, qty: 5, restockedDaysAgo: 35 },
      ],
    },
    {
      name: "Canvas High-Tops (Unisex)",
      category: "Footwear",
      brand: "Striide",
      description: "Classic canvas high-tops that go with everything. All-season.",
      image: "/products/high-tops.jpg",
      serialPrefix: "STRI-303",
      variants: [
        { sizeLabel: "39", color: "White", price: 32000, qty: 7, restockedDaysAgo: 22 },
        { sizeLabel: "40", color: "White", price: 32000, qty: 8, restockedDaysAgo: 22 },
        { sizeLabel: "41", color: "Black", price: 32000, qty: 10, restockedDaysAgo: 22 },
        { sizeLabel: "42", color: "Black", price: 32000, qty: 9, restockedDaysAgo: 22 },
        { sizeLabel: "43", color: "Black", price: 32500, qty: 6, restockedDaysAgo: 22 },
        { sizeLabel: "44", color: "White", price: 32500, qty: 4, restockedDaysAgo: 75 },
      ],
    },
    {
      name: "Suede Chelsea Boots",
      category: "Footwear",
      brand: "Raven",
      description: "Slip-on suede chelsea boots with elastic gore. Sharp with everything.",
      image: "/products/chelsea-boots.jpg",
      serialPrefix: "RVSB-304",
      variants: [
        { sizeLabel: "40", color: "Brown", price: 52000, qty: 5, restockedDaysAgo: 35 },
        { sizeLabel: "41", color: "Brown", price: 52000, qty: 4, restockedDaysAgo: 35 },
        { sizeLabel: "42", color: "Black", price: 52000, qty: 6, restockedDaysAgo: 35 },
        { sizeLabel: "43", color: "Black", price: 52500, qty: 3, restockedDaysAgo: 90, notes: "Slow mover — consider discount" },
      ],
    },
    {
      name: "Women's Block Heels",
      category: "Footwear",
      brand: "Raven",
      description: "Comfortable block heels for work and events. Cushioned insole.",
      image: "/products/block-heels.jpg",
      serialPrefix: "STHE-305",
      variants: [
        { sizeLabel: "39", color: "Black", price: 29000, qty: 6, restockedDaysAgo: 28 },
        { sizeLabel: "40", color: "Black", price: 29000, qty: 7, restockedDaysAgo: 28 },
        { sizeLabel: "40", color: "Nude", price: 29500, qty: 4, restockedDaysAgo: 65 },
        { sizeLabel: "41", color: "Nude", price: 29500, qty: 3, restockedDaysAgo: 65 },
      ],
    },
    {
      name: "Men's Leather Sandals",
      category: "Footwear",
      brand: "Striide",
      description: "Hand-finished leather slides. Moulds to the foot over time.",
      image: "/products/leather-sandals.jpg",
      serialPrefix: "STMS-306",
      variants: [
        { sizeLabel: "41", color: "Brown", price: 26000, qty: 8, restockedDaysAgo: 32 },
        { sizeLabel: "42", color: "Brown", price: 26000, qty: 9, restockedDaysAgo: 32 },
        { sizeLabel: "43", color: "Black", price: 26000, qty: 7, restockedDaysAgo: 32 },
        { sizeLabel: "44", color: "Black", price: 26000, qty: 5, restockedDaysAgo: 32 },
        { sizeLabel: "45", color: "Brown", price: 26500, qty: 3, restockedDaysAgo: 100 },
      ],
    },
    {
      name: "Ankara Print Headwrap",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Hand-tied ankara headwrap, stiffened edge for easy tying. Assorted prints.",
      image: "/products/ankara-headwrap.jpg",
      serialPrefix: "APAH-401",
      variants: [
        { sizeLabel: "One Size", color: "Gold", price: 5500, qty: 18, restockedDaysAgo: 10 },
        { sizeLabel: "One Size", color: "Royal Blue", price: 5500, qty: 15, restockedDaysAgo: 10 },
        { sizeLabel: "One Size", color: "Coral", price: 5500, qty: 12, restockedDaysAgo: 45 },
        { sizeLabel: "One Size", color: "Forest Green", price: 5500, qty: 2, restockedDaysAgo: 110, notes: "Consider clearing" },
      ],
    },
    {
      name: "Baby Pram Blanket (Fleece)",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Soft fleece pram blanket, generous 90×90cm size. Gift-wrap available.",
      image: "/products/pram-blanket.jpg",
      serialPrefix: "APBP-402",
      variants: [
        { sizeLabel: "One Size", color: "Mint", price: 6500, qty: 13, restockedDaysAgo: 22 },
        { sizeLabel: "One Size", color: "Lilac", price: 6500, qty: 10, restockedDaysAgo: 22 },
        { sizeLabel: "One Size", color: "Butter", price: 6500, qty: 9, restockedDaysAgo: 22 },
      ],
    },
    {
      name: "Kids Anime Backpack",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Padded-back school backpack, 18L, water-resistant front pocket.",
      image: "/products/kids-backpack.jpg",
      serialPrefix: "APKB-403",
      variants: [
        { sizeLabel: "One Size", color: "Blue", price: 12000, qty: 15, restockedDaysAgo: 12 },
        { sizeLabel: "One Size", color: "Red", price: 12000, qty: 12, restockedDaysAgo: 12 },
        { sizeLabel: "One Size", color: "Multi", price: 12500, qty: 8, restockedDaysAgo: 12 },
      ],
    },
    {
      name: "School Lunch Box (2-Tier)",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Leak-proof two-tier lunch box with carry strap. BPA-free.",
      image: "/products/lunch-box.jpg",
      serialPrefix: "APLB-404",
      variants: [
        { sizeLabel: "One Size", color: "Mint", price: 8500, qty: 14, restockedDaysAgo: 16 },
        { sizeLabel: "One Size", color: "Pink", price: 8500, qty: 11, restockedDaysAgo: 16 },
      ],
    },
    {
      name: "Baby Pacifier Clip Set",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Food-grade silicone pacifier clips, set of 2. Rust-free snaps.",
      image: "/products/pacifier-clip.jpg",
      serialPrefix: "APPC-405",
      variants: [
        { sizeLabel: "One Size", color: "Pastel", price: 4500, qty: 20, restockedDaysAgo: 8 },
      ],
    },
    {
      name: "Kids Sunglasses (UV400)",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Shatter-proof UV400 sunglasses with adjustable strap.",
      image: "/products/kids-sunglasses.jpg",
      serialPrefix: "APSG-406",
      variants: [
        { sizeLabel: "One Size", color: "Black", price: 6000, qty: 10, restockedDaysAgo: 26 },
        { sizeLabel: "One Size", color: "Pink", price: 6000, qty: 8, restockedDaysAgo: 26 },
      ],
    },
    {
      name: "Hair Bow Set (6 pcs)",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Six assorted satin bows on strong clips. Gift-boxed.",
      image: "/products/hair-bows.jpg",
      serialPrefix: "APHB-407",
      variants: [
        { sizeLabel: "One Size", color: "Assorted", price: 5000, qty: 18, restockedDaysAgo: 10 },
      ],
    },
    {
      name: "Wooden Stacking Blocks",
      category: "Toys",
      brand: "PlayWood",
      description: "24-piece wooden block set with non-toxic paint. Builds motor skills.",
      image: "/products/stacking-blocks.jpg",
      serialPrefix: "TYWB-501",
      variants: [
        { sizeLabel: "One Size", color: "Natural", price: 10500, qty: 9, restockedDaysAgo: 24 },
      ],
    },
    {
      name: "Plush Teddy Bear (60cm)",
      category: "Toys",
      brand: "PlayWood",
      description: "Super-soft 60cm teddy bear, safe from birth. Machine washable.",
      image: "/products/teddy-bear.jpg",
      serialPrefix: "TYTB-502",
      variants: [
        { sizeLabel: "One Size", color: "Cream", price: 13500, qty: 12, restockedDaysAgo: 19 },
        { sizeLabel: "One Size", color: "Brown", price: 13500, qty: 10, restockedDaysAgo: 19 },
      ],
    },
    {
      name: "Kids 3-Wheel Scooter",
      category: "Toys",
      brand: "PlayWood",
      description: "Lean-to-steer scooter with light-up wheels and adjustable bar.",
      image: "/products/scooter.jpg",
      serialPrefix: "TYSR-503",
      variants: [
        { sizeLabel: "One Size", color: "Blue", price: 45000, qty: 5, restockedDaysAgo: 36 },
        { sizeLabel: "One Size", color: "Pink", price: 45000, qty: 4, restockedDaysAgo: 36 },
      ],
    },
    {
      name: "ABC Learning Flashcards",
      category: "Toys",
      brand: "PlayWood",
      description: "52 illustrated alphabet cards for early reading. Wipe-clean finish.",
      image: "/products/flashcards.jpg",
      serialPrefix: "TYFC-504",
      variants: [
        { sizeLabel: "One Size", color: "Mixed", price: 6500, qty: 16, restockedDaysAgo: 15 },
      ],
    },
  ];

  const variantBySerial = new Map<string, { id: string; price: number }>();

  for (const p of products) {
    const [product] = await db
      .insert(schema.products)
      .values({
        name: p.name,
        category: p.category,
        brand: p.brand,
        description: p.description,
        images: [p.image],
      })
      .returning();

    const rows = await db
      .insert(schema.variants)
      .values(
        p.variants.map((v, i) => ({
          productId: product.id,
          serialNo: `${p.serialPrefix}-${v.sizeLabel.replace(" months", "").replace(/\s+/g, "")}-${i + 1}`,
          sizeOptionId: sizeId(v.sizeLabel),
          color: v.color ?? null,
          price: v.price.toFixed(2),
          quantityInStock: v.qty,
          restockedAt: daysAgo(v.restockedDaysAgo),
          notes: v.notes ?? null,
        })),
      )
      .returning();
    rows.forEach((r) => variantBySerial.set(r.serialNo, { id: r.id, price: Number(r.price) }));
  }

  /* ── Historical orders (past sales for dashboard + ledger columns) ── */
  console.log("Seeding orders…");
  const customerRows = await db
    .insert(schema.customers)
    .values([
      { name: "Adaeze Okonkwo", email: "adaeze@example.com", phone: "08031234567" },
      { name: "Tunde Balogun", email: "tunde@example.com", phone: "08127654321" },
      { name: "Fatima Bello", email: "fatima@example.com", phone: "07033455678" },
      { name: "Chinedu Eze", email: "chinedu@example.com", phone: "09081122334" },
    ])
    .returning();

  const orderSeeds: {
    customer: number;
    daysAgo: number;
    status: "paid" | "shipped" | "pending";
    items: { serial: string; qty: number }[];
  }[] = [
    { customer: 0, daysAgo: 52, status: "shipped", items: [{ serial: "KLAG-101-0-6-1", qty: 2 }, { serial: "STAR-301-39-1", qty: 1 }] },
    { customer: 1, daysAgo: 45, status: "shipped", items: [{ serial: "STAR-301-41-3", qty: 1 }] },
    { customer: 2, daysAgo: 38, status: "shipped", items: [{ serial: "SKCS-205-30-2", qty: 1 }, { serial: "SKCS-205-32-4", qty: 1 }] },
    { customer: 3, daysAgo: 30, status: "shipped", items: [{ serial: "KLBC-102-0-6-1", qty: 2 }, { serial: "KLBC-102-6-12-2", qty: 1 }] },
    { customer: 0, daysAgo: 24, status: "paid", items: [{ serial: "APAH-401-OneSize-1", qty: 1 }] },
    { customer: 1, daysAgo: 16, status: "paid", items: [{ serial: "KLTD-105-6-12-2", qty: 1 }, { serial: "APAH-401-OneSize-1", qty: 2 }] },
    { customer: 2, daysAgo: 12, status: "paid", items: [{ serial: "KLTD-105-6-12-2", qty: 1 }, { serial: "TYTB-502-OneSize-1", qty: 1 }] },
    { customer: 3, daysAgo: 9, status: "paid", items: [{ serial: "STAR-301-43-6", qty: 1 }, { serial: "APAH-401-OneSize-1", qty: 1 }] },
    { customer: 1, daysAgo: 7, status: "paid", items: [{ serial: "STRI-303-42-4", qty: 1 }, { serial: "APKB-403-OneSize-1", qty: 2 }] },
    { customer: 2, daysAgo: 5, status: "paid", items: [{ serial: "GSPF-208-30-2", qty: 1 }, { serial: "TYFC-504-OneSize-1", qty: 2 }] },
    { customer: 0, daysAgo: 2, status: "pending", items: [{ serial: "KLBC-102-18-24-4", qty: 1 }] },
  ];

  for (const [n, o] of orderSeeds.entries()) {
    const items = o.items.map((i) => ({
      variant: variantBySerial.get(i.serial)!,
      qty: i.qty,
    }));
    const total = items.reduce((sum, i) => sum + i.variant.price * i.qty, 0);
    const [order] = await db
      .insert(schema.orders)
      .values({
        customerId: customerRows[o.customer].id,
        status: o.status,
        totalAmount: total.toFixed(2),
        paymentReference: `seed-ord-${n + 1}`,
        shippingAddress: "12 Awolowo Road, Ikoyi, Lagos",
        createdAt: daysAgo(o.daysAgo),
      })
      .returning();
    await db.insert(schema.orderItems).values(
      items.map((i) => ({
        orderId: order.id,
        variantId: i.variant.id,
        quantity: i.qty,
        unitPrice: i.variant.price.toFixed(2),
      })),
    );
  }

  /* ── Admin account ── */
  console.log("Creating admin account…");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@kidora.store";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const { user } = await auth.api.signUpEmail({
    body: { name: "Store Admin", email: adminEmail, password: adminPassword },
  });
  await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, user.id));

  console.log(
    `✔ Seed complete: ${products.length} products, ${variantBySerial.size} variants, ${orderSeeds.length} orders. Admin: ${adminEmail}`,
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
