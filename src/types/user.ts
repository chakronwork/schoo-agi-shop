// User types

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'user' | 'seller' | 'admin';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user: User;
  addresses: Address[];
  orders_count: number;
  total_spent: number;
}
