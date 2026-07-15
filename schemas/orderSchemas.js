import { z } from "zod";

const orderItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.number().int().positive().default(1),
  sourceDonation: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid donation id")
    .optional(),
});

export const placeOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, "Order must include at least one item"),
    fulfillmentType: z.enum(["locker", "delivery"]).default("locker"),
  }),
});