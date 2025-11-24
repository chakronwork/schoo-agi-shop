// src/components/features/products/ProductCard.jsx
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Star } from 'lucide-react'

const formatPrice = (price) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price)
}

export default function ProductCard({ product }) {
  const imageUrl = product.product_images?.[0]?.image_url || 'https://placehold.co/400x400/e2e8f0/1e293b?text=No+Image'
  const storeName = product.stores?.store_name || 'N/A'
  
  const rating = product.avgRating || 0

  return (
     <Link href={`/product/${product.id}`} className="block group h-full">
      <div className="bg-white border border-agri-pastel rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-agri-accent transition-all duration-300 h-full flex flex-col">
        
        {/* Image Area */}
        <div className="relative w-full pt-[100%] bg-gray-50">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            // ✅ ใส่ unoptimized เพื่อแก้ปัญหา 400 Bad Request ทันที
            unoptimized 
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
          
          {product.stock_quantity < 5 && product.stock_quantity > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
              เหลือ {product.stock_quantity} ชิ้น
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <span className="bg-agri-pastel text-agri-primary px-2 py-0.5 rounded text-[10px] font-bold">ร้านค้า</span>
            {storeName}
          </p>
          
          <h3 className="text-gray-800 font-medium line-clamp-2 mb-2 group-hover:text-agri-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={14} 
                className={i < Math.floor(rating) ? "fill-agri-warning text-agri-warning" : "text-gray-300"} 
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">({product.reviewCount || 0})</span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-agri-primary">{formatPrice(product.price)}</p>
            </div>
            <div className="bg-agri-pastel p-2 rounded-full text-agri-primary hover:bg-agri-primary hover:text-white transition-colors">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}