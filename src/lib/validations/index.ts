import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว'),
  full_name: z.string().min(2, 'ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร').optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

export const addressSchema = z.object({
  name: z.string().min(2, 'ชื่อผู้รับต้องมีความยาวอย่างน้อย 2 ตัวอักษร'),
  phone: z.string().min(9, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
  address_line1: z.string().min(5, 'ที่อยู่ต้องมีความยาวอย่างน้อย 5 ตัวอักษร'),
  address_line2: z.string().optional(),
  subdistrict: z.string().min(2, 'กรุณาเลือกแขวง/ตำบล'),
  district: z.string().min(2, 'กรุณาเลือกเขต/อำเภอ'),
  province: z.string().min(2, 'กรุณาเลือกจังหวัด'),
  postal_code: z.string().length(5, 'รหัสไปรษณีย์ต้องเป็น 5 หลัก'),
  country: z.string().default('Thailand'),
  is_default: z.boolean().default(false),
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(3, 'ชื่อสินค้าต้องมีความยาวอย่างน้อย 3 ตัวอักษร'),
  description: z.string().min(10, 'รายละเอียดสินค้าต้องมีความยาวอย่างน้อย 10 ตัวอักษร'),
  category_id: z.string().uuid('กรุณาเลือกหมวดหมู่'),
  price: z.number().positive('ราคาต้องมากกว่า 0'),
  original_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative('จำนวนสินค้าต้องมากกว่าหรือเท่ากับ 0'),
  unit: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
  images: z.array(z.string().url()).min(1, 'ต้องมีรูปภาพอย่างน้อย 1 รูป'),
  status: z.enum(['draft', 'pending', 'active']).default('draft'),
});

export const updateProductSchema = createProductSchema.partial();

// Order validation schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'ต้องมีสินค้าอย่างน้อย 1 รายการ'),
  shipping_address_id: z.string().uuid('กรุณาเลือกที่อยู่จัดส่ง'),
  notes: z.string().max(500).optional(),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(999),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(999),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1).optional(),
  category_id: z.string().uuid().optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'popular', 'rating']).default('relevance'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
