import { z } from "zod";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(120),
  quantity: z.number().int().positive().default(1),
  unit: z.string().trim().max(30).default("unit"),
  category: z.string().trim().max(50).default("general"),
  expiryEstimate: z.coerce.date().optional(),
});

export const createDonationSchema = z.object({
  body: z.object({
    items: z.array(itemSchema).min(1, "At least one item is required"),
    pickupAddress: z.string().trim().min(3, "Pickup address is required").max(300),
    pickupWindowStart: z.coerce.date().optional(),
    pickupWindowEnd: z.coerce.date().optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const updateDonationStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid donation id"),
  }),
  body: z.object({
    status: z.enum(["listed", "claimed", "in_transit", "delivered", "cancelled"]),
  }),
});