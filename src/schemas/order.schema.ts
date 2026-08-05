import { z } from "zod";
import { addressSchema } from "./user.schema";

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  image: z.string().optional(),
  variation: z.string().optional(),
  unitPrice: z.number(),
  quantity: z.number().int().positive(),
  lineTotal: z.number(),
});

export const orderTotalsSchema = z.object({
  subtotal: z.number(),
  discount: z.number(),
  shipping: z.number(),
  tax: z.number(),
  total: z.number(),
});

export const orderDocumentSchema = z
  .object({
    userId: z.string(),
    reference: z.string(),
    items: z.array(orderItemSchema),
    totals: orderTotalsSchema,
    status: z.enum([
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ]),
    paymentMethod: z.enum(["card", "transfer", "cash-on-delivery"]).optional(),
    paymentReference: z.string().optional(),
    shippingAddress: addressSchema.optional(),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .loose();
