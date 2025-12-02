import { z } from "zod"

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
})

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(8).max(128),
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
})

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(1000000),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  stockQuantity: z.number().int().min(0).max(999999),
  deliveryContent: z.string().max(10000).optional(),
  productType: z.enum(["digital", "physical"]).optional(),
  isActive: z.boolean().optional(),
  vendorName: z.string().max(200).optional(),
})

export const orderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(1000),
  totalAmount: z.number().positive().max(1000000),
  cryptoAddress: z.string().optional(),
  paymentTxHash: z.string().optional(),
})

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: `${firstError.path.join(".")}: ${firstError.message}` }
    }
    return { success: false, error: "Validation failed" }
  }
}
