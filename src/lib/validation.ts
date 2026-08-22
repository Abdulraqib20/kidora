/** Zod validation schemas for products, variants, size options, and checkout payloads. */
import { z } from "zod";


export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  images: z.array(z.string()).optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

export const variantCreateSchema = z.object({
  productId: z.uuid(),
  serialNo: z.string().min(1, "Serial number is required"),
  sizeOptionId: z.uuid(),
  color: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  quantityInStock: z.number().int().min(0),
  notes: z.string().optional().nullable(),
});

export const variantUpdateSchema = variantCreateSchema
  .omit({ productId: true })
  .partial();

export const restockSchema = z.object({
  addQuantity: z.number().int().min(1),
});

export const sizeOptionCreateSchema = z.object({
  label: z.string().min(1, "Label is required"),
  category: z.string().min(1, "Category is required"),
  sortOrder: z.number().int().min(0).optional(),
});

export const sizeOptionUpdateSchema = sizeOptionCreateSchema.partial();

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Cart is empty"),
  customer: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Valid email is required"),
    phone: z.string().optional(),
  }),
  shippingAddress: z.string().min(5, "Delivery address is required"),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "cancelled"]),
});
