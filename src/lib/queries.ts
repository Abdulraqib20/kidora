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

// Live sales subquery deriving units and revenue from non-cancelled order items.
const salesByVariant = db
  .select({
    variantId: orderItems.variantId,
    qtySold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`.as("qty_sold"),
    totalSales:
      sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPrice}), 0)::float8`.as(
        "total_sales",
      ),
  })
  .from(orderItems)
  .innerJoin(orders, eq(orders.id, orderItems.orderId))
  .where(ne(orders.status, "cancelled"))
  .groupBy(orderItems.variantId)
  .as("sales");

const variantAgg = db
  .select({
    productId: variants.productId,
    minPrice: sql<number>`min(${variants.price})::float8`.as("min_price"),
    totalStock: sql<number>`coalesce(sum(${variants.quantityInStock}), 0)::int`.as(
      "total_stock",
    ),
    variantCount: sql<number>`count(*)::int`.as("variant_count"),
  })
  .from(variants)
  .groupBy(variants.productId)
  .as("va");

const salesByProduct = db
  .select({
    productId: variants.productId,
    unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`.as(
      "units_sold",
    ),
  })
  .from(orderItems)
  .innerJoin(orders, eq(orders.id, orderItems.orderId))
  .innerJoin(variants, eq(variants.id, orderItems.variantId))
  .where(ne(orders.status, "cancelled"))
  .groupBy(variants.productId)
  .as("sp");

export type ProductListFilters = {
  q?: string;
  category?: string;
  sizeOptionId?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
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
  unitsSold: number;
};

/** Query storefront products with aggregated price ranges, stock totals, and active filters. */
export async function listProducts(filters: ProductListFilters): Promise<ProductCard[]> {
  const conditions = [];

  if (filters.q) {
    const like = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(products.name, like),
        ilike(products.brand, like),
        ilike(products.category, like),
        sql`exists (select 1 from variants v where v.product_id = ${products.id} and v.serial_no ilike ${like})`,
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
      unitsSold: sql<number>`coalesce(${salesByProduct.unitsSold}, 0)::int`,
    })
    .from(products)
    .leftJoin(variantAgg, eq(variantAgg.productId, products.id))
    .leftJoin(salesByProduct, eq(salesByProduct.productId, products.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(filters.limit ?? 500);

  return rows;
}

/** Fetch unique product categories sorted alphabetically for navigation. */
export async function listCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .orderBy(asc(products.category));
  return rows.map((r) => r.category);
}


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
  notes: string | null;
  qtySold: number;
};

/** Fetch product record and associated variants with size and sales details by ID. */
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
      notes: variants.notes,
      qtySold: sql<number>`coalesce(${salesByVariant.qtySold}, 0)::int`,
    })
    .from(variants)
    .innerJoin(sizeOptions, eq(sizeOptions.id, variants.sizeOptionId))
    .leftJoin(salesByVariant, eq(salesByVariant.variantId, variants.id))
    .where(eq(variants.productId, productId))
    .orderBy(asc(sizeOptions.category), asc(sizeOptions.sortOrder));

  return { product, variants: rows satisfies VariantDetail[] };
}

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

/** Fetch full inventory ledger rows combining variants, pricing, stock levels, and sales totals. */
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

export type SizeOptionWithUsage = {
  id: string;
  label: string;
  category: string;
  sortOrder: number;
  variantCount: number;
};

/** Fetch size options with active variant usage counts, optionally filtered by category. */
export async function listSizeOptions(category?: string): Promise<SizeOptionWithUsage[]> {
  const counts = db
    .select({
      sizeOptionId: variants.sizeOptionId,
      variantCount: sql<number>`count(*)::int`.as("variant_count"),
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

/** Fetch order summaries with aggregated item counts, optionally filtered by order status. */
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

/** Fetch customer order history and item counts matched by customer email address. */
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

/** Fetch full order details including customer info and individual purchased line items. */
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

/** Query live stock and pricing for specific variant IDs to validate cart items before checkout. */
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

/** Aggregate 30-day revenue trends, top-selling variants, order status totals, and inventory value. */
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

