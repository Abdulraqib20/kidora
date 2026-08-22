import { and, asc, desc, eq, gte, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  orderItems,
  orders,
  products,
  sizeOptions,
  variants,
} from "@/db/schema";

/* ── Shared aggregate subqueries ──────────────────────────────────────
   qty_sold / total_sales are always derived from order_items (excluding
   cancelled orders) — never stored on variants. */

const salesByVariant = db
  .select({
    variantId: orderItems.variantId,
    qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    totalSales: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPrice}), 0)::float8`,
  })
  .from(orderItems)
  .innerJoin(orders, eq(orders.id, orderItems.orderId))
  .where(ne(orders.status, "cancelled"))
  .groupBy(orderItems.variantId)
  .as("sales");

const variantAgg = db
  .select({
    productId: variants.productId,
    minPrice: sql<number>`min(${variants.price})::float8`,
    totalStock: sql<number>`coalesce(sum(${variants.quantityInStock}), 0)::int`,
    variantCount: sql<number>`count(*)::int`,
  })
  .from(variants)
  .groupBy(variants.productId)
  .as("va");

/* ── Storefront: product listing ────────────────────────────────────── */

export type ProductListFilters = {
  q?: string;
  category?: string;
  sizeOptionId?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductCard = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  images: string[];
  minPrice: number;
  totalStock: number;
  variantCount: number;
};

export async function listProducts(filters: ProductListFilters): Promise<ProductCard[]> {
  const conditions = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(products.name, like),
        ilike(products.brand, like),
        ilike(products.category, like),
      ),
    );
  }
  if (filters.category) conditions.push(eq(products.category, filters.category));
  if (filters.sizeOptionId) {
    conditions.push(
      sql`exists (select 1 from variants v where v.product_id = ${products.id} and v.size_option_id = ${filters.sizeOptionId})`,
    );
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const min = filters.minPrice ?? 0;
    const max = filters.maxPrice ?? Number.MAX_SAFE_INTEGER;
    conditions.push(
      sql`exists (select 1 from variants v where v.product_id = ${products.id} and v.price between ${min} and ${max})`,
    );
  }

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      brand: products.brand,
      category: products.category,
      images: products.images,
      minPrice: sql<number>`coalesce(${variantAgg.minPrice}, 0)::float8`,
      totalStock: sql<number>`coalesce(${variantAgg.totalStock}, 0)::int`,
      variantCount: sql<number>`coalesce(${variantAgg.variantCount}, 0)::int`,
    })
    .from(products)
    .leftJoin(variantAgg, eq(variantAgg.productId, products.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt));

  return rows;
}

export async function listCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .orderBy(asc(products.category));
  return rows.map((r) => r.category);
}

/* ── Storefront: product detail ─────────────────────────────────────── */

export type VariantDetail = {
  id: string;
  serialNo: string;
  color: string | null;
  price: number;
  quantityInStock: number;
  sizeOptionId: string;
  sizeLabel: string;
  sizeCategory: string;
  sortOrder: number;
};

export async function getProductWithVariants(productId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product) return null;

  const rows = await db
    .select({
      id: variants.id,
      serialNo: variants.serialNo,
      color: variants.color,
      price: sql<number>`${variants.price}::float8`,
      quantityInStock: variants.quantityInStock,
      sizeOptionId: sizeOptions.id,
      sizeLabel: sizeOptions.label,
      sizeCategory: sizeOptions.category,
      sortOrder: sizeOptions.sortOrder,
    })
    .from(variants)
    .innerJoin(sizeOptions, eq(sizeOptions.id, variants.sizeOptionId))
    .where(eq(variants.productId, productId))
    .orderBy(asc(sizeOptions.category), asc(sizeOptions.sortOrder));

  return { product, variants: rows satisfies VariantDetail[] };
}

/* ── Admin: inventory ledger (mirrors the paper ledger columns) ─────── */

export type InventoryRow = {
  variantId: string;
  productId: string;
  productName: string;
  brand: string | null;
  category: string;
  serialNo: string;
  sizeLabel: string;
  sizeCategory: string;
  color: string | null;
  price: number;
  quantityInStock: number;
  restockedAt: Date;
  notes: string | null;
  qtySold: number;
  totalSales: number;
};

export async function getInventoryRows(): Promise<InventoryRow[]> {
  return db
    .select({
      variantId: variants.id,
      productId: products.id,
      productName: products.name,
      brand: products.brand,
      category: products.category,
      serialNo: variants.serialNo,
      sizeLabel: sizeOptions.label,
      sizeCategory: sizeOptions.category,
      color: variants.color,
      price: sql<number>`${variants.price}::float8`,
      quantityInStock: variants.quantityInStock,
      restockedAt: variants.restockedAt,
      notes: variants.notes,
      qtySold: sql<number>`coalesce(${salesByVariant.qtySold}, 0)::int`,
      totalSales: sql<number>`coalesce(${salesByVariant.totalSales}, 0)::float8`,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .innerJoin(sizeOptions, eq(sizeOptions.id, variants.sizeOptionId))
    .leftJoin(salesByVariant, eq(salesByVariant.variantId, variants.id))
    .orderBy(asc(products.name), asc(sizeOptions.sortOrder));
}

/* ── Size options ───────────────────────────────────────────────────── */

export type SizeOptionWithUsage = {
  id: string;
  label: string;
  category: string;
  sortOrder: number;
  variantCount: number;
};

export async function listSizeOptions(category?: string): Promise<SizeOptionWithUsage[]> {
  const counts = db
    .select({
      sizeOptionId: variants.sizeOptionId,
      variantCount: sql<number>`count(*)::int`,
    })
    .from(variants)
    .groupBy(variants.sizeOptionId)
    .as("vc");

  return db
    .select({
      id: sizeOptions.id,
      label: sizeOptions.label,
      category: sizeOptions.category,
      sortOrder: sizeOptions.sortOrder,
      variantCount: sql<number>`coalesce(${counts.variantCount}, 0)::int`,
    })
    .from(sizeOptions)
    .leftJoin(counts, eq(counts.sizeOptionId, sizeOptions.id))
    .where(category ? eq(sizeOptions.category, category) : undefined)
    .orderBy(asc(sizeOptions.category), asc(sizeOptions.sortOrder));
}

/* ── Orders ─────────────────────────────────────────────────────────── */

export type OrderSummary = {
  id: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  totalAmount: number;
  paymentReference: string | null;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  itemCount: number;
};

export async function listOrders(status?: OrderSummary["status"]): Promise<OrderSummary[]> {
  return db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: sql<number>`${orders.totalAmount}::float8`,
      paymentReference: orders.paymentReference,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerEmail: customers.email,
      itemCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(status ? eq(orders.status, status) : undefined)
    .groupBy(orders.id, customers.name, customers.email)
    .orderBy(desc(orders.createdAt));
}

export async function listOrdersForEmail(email: string): Promise<OrderSummary[]> {
  return db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: sql<number>`${orders.totalAmount}::float8`,
      paymentReference: orders.paymentReference,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerEmail: customers.email,
      itemCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(eq(customers.email, email))
    .groupBy(orders.id, customers.name, customers.email)
    .orderBy(desc(orders.createdAt));
}

export type OrderDetail = Awaited<ReturnType<typeof getOrderDetail>>;

export async function getOrderDetail(orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: sql<number>`${orders.totalAmount}::float8`,
      paymentReference: orders.paymentReference,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(eq(orders.id, orderId));

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: sql<number>`${orderItems.unitPrice}::float8`,
      productName: products.name,
      serialNo: variants.serialNo,
      color: variants.color,
      sizeLabel: sizeOptions.label,
    })
    .from(orderItems)
    .innerJoin(variants, eq(variants.id, orderItems.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .innerJoin(sizeOptions, eq(sizeOptions.id, variants.sizeOptionId))
    .where(eq(orderItems.orderId, orderId));

  return { order, items };
}

/* ── Checkout: live variant data for server-side cart validation ────── */

export async function getVariantsForCheckout(variantIds: string[]) {
  if (variantIds.length === 0) return [];
  return db
    .select({
      id: variants.id,
      serialNo: variants.serialNo,
      price: sql<number>`${variants.price}::float8`,
      quantityInStock: variants.quantityInStock,
      productName: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, variantIds));
}

/* ── Admin: dashboard ───────────────────────────────────────────────── */

export async function getDashboardStats() {
  const revenue30 = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::float8`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, ["paid", "shipped"]),
        gte(orders.createdAt, sql`now() - interval '30 days'`),
      ),
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`);

  const topVariants = await db
    .select({
      productName: products.name,
      sizeLabel: sizeOptions.label,
      color: variants.color,
      qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      revenue: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPrice}), 0)::float8`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(variants, eq(variants.id, orderItems.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .innerJoin(sizeOptions, eq(sizeOptions.id, variants.sizeOptionId))
    .where(ne(orders.status, "cancelled"))
    .groupBy(products.name, sizeOptions.label, variants.color)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  const [totals] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','shipped') then ${orders.totalAmount} else 0 end), 0)::float8`,
      pendingCount: sql<number>`count(*) filter (where ${orders.status} = 'pending')::int`,
      paidCount: sql<number>`count(*) filter (where ${orders.status} = 'paid')::int`,
      shippedCount: sql<number>`count(*) filter (where ${orders.status} = 'shipped')::int`,
      cancelledCount: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
    })
    .from(orders);

  const [stock] = await db
    .select({
      inventoryValue: sql<number>`coalesce(sum(${variants.price} * ${variants.quantityInStock}), 0)::float8`,
      unitsInStock: sql<number>`coalesce(sum(${variants.quantityInStock}), 0)::int`,
    })
    .from(variants);

  return { revenue30, topVariants, totals, stock };
}
