// Cart types

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  items: CartItem[];
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  price: number;
  quantity: number;
  stock_available: number;
  seller_id: string;
  seller_name: string;
  added_at: string;
  updated_at: string;
}

export interface CartSummary {
  items_count: number;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
}
