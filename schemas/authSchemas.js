import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, "Full name is too short").max(100),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["donor", "volunteer", "recipient", "admin"]),
    phone: z.string().trim().optional(),
    organizationName: z.string().trim().optional(),
    donorType: z.enum(["individual", "restaurant", "grocery", "farm"]).optional(),
    householdSize: z.number().int().positive().optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
    vehicleType: z.enum(["car", "bike", "on_foot", "van"]).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "refreshToken is required"),
  }),
});