// Order types

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  currency: string;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: ShippingAddress;
  items: OrderItem[];
  tracking_number?: string;
  notes?: string;
  cancelled_at?: string;
  cancel_reason?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  total: number;
  seller_id: string;
  seller_name: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  country: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  items_count: number;
  created_at: string;
}
