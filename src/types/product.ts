// Product types

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  category_id: string;
  price: number;
  original_price?: number;
  currency: string;
  stock_quantity: number;
  unit: string;
  images: string[];
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'rejected';
  rating_average: number;
  review_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  order: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment?: string;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  seller: SellerInfo;
  category: Category;
  reviews: Review[];
}

export interface SellerInfo {
  id: string;
  name: string;
  rating_average: number;
  total_products: number;
  response_rate: number;
  joined_date: string;
}
