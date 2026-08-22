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
      image: "/products/floral-gown.svg",
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
      image: "/products/cartoon-set.svg",
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
      image: "/products/cotton-romper.svg",
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
      image: "/products/denim-overalls.svg",
      serialPrefix: "KLTO-104",
      variants: [
        { sizeLabel: "12-18 months", price: 12500, qty: 6, restockedDaysAgo: 30 },
        { sizeLabel: "18-24 months", price: 12500, qty: 5, restockedDaysAgo: 30 },
        { sizeLabel: "24-36 months", price: 13000, qty: 8, restockedDaysAgo: 30 },
      ],
    },
    {
      name: "Kids Canvas Slip-On",
      category: "Kids Shoes",
      brand: "Skipers",
      description: "Easy-wear canvas slip-ons with rubber sole. Machine washable.",
      image: "/products/canvas-slipon.svg",
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
      image: "/products/lightup-sneaker.svg",
      serialPrefix: "GSKL-206",
      variants: [
        { sizeLabel: "28", color: "Silver", price: 18000, qty: 5, restockedDaysAgo: 15 },
        { sizeLabel: "30", color: "Silver", price: 18000, qty: 8, restockedDaysAgo: 15 },
        { sizeLabel: "32", color: "Black", price: 18500, qty: 10, restockedDaysAgo: 15 },
        { sizeLabel: "34", color: "Black", price: 18500, qty: 6, restockedDaysAgo: 15 },
      ],
    },
    {
      name: "Air Runner Sneakers",
      category: "Footwear",
      brand: "Striide",
      description: "Cushioned everyday running sneakers. Original quality, full size run.",
      image: "/products/air-runner.svg",
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
      image: "/products/leather-loafer.svg",
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
      name: "Ankara Print Headwrap",
      category: "Accessories",
      brand: "Aunty's Picks",
      description: "Hand-tied ankara headwrap, stiffened edge for easy tying. Assorted prints.",
      image: "/products/ankara-headwrap.svg",
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
      image: "/products/pram-blanket.svg",
      serialPrefix: "APBP-402",
      variants: [
        { sizeLabel: "One Size", color: "Mint", price: 6500, qty: 13, restockedDaysAgo: 22 },
        { sizeLabel: "One Size", color: "Lilac", price: 6500, qty: 10, restockedDaysAgo: 22 },
        { sizeLabel: "One Size", color: "Butter", price: 6500, qty: 9, restockedDaysAgo: 22 },
      ],
    },
  ];

  const variantIds: { id: string; price: number }[] = [];

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
    rows.forEach((r) => variantIds.push({ id: r.id, price: Number(r.price) }));
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
    items: { idx: number; qty: number }[];
  }[] = [
    { customer: 0, daysAgo: 52, status: "shipped", items: [{ idx: 0, qty: 2 }, { idx: 5, qty: 1 }] },
    { customer: 1, daysAgo: 45, status: "shipped", items: [{ idx: 20, qty: 1 }] },
    { customer: 2, daysAgo: 38, status: "shipped", items: [{ idx: 24, qty: 1 }, { idx: 26, qty: 1 }] },
    { customer: 3, daysAgo: 30, status: "shipped", items: [{ idx: 9, qty: 2 }, { idx: 11, qty: 1 }] },
    { customer: 0, daysAgo: 24, status: "paid", items: [{ idx: 38, qty: 1 }] },
    { customer: 1, daysAgo: 16, status: "paid", items: [{ idx: 17, qty: 1 }, { idx: 39, qty: 2 }] },
    { customer: 2, daysAgo: 9, status: "paid", items: [{ idx: 30, qty: 1 }, { idx: 41, qty: 1 }] },
    { customer: 3, daysAgo: 2, status: "pending", items: [{ idx: 3, qty: 1 }] },
  ];

  for (const [n, o] of orderSeeds.entries()) {
    const items = o.items.map((i) => ({
      variant: variantIds[i.idx],
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

  console.log(`✔ Seed complete. Admin: ${adminEmail} / ${adminPassword} (change ADMIN_PASSWORD in .env before going live)`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
