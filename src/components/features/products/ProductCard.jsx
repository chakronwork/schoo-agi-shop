// src/components/features/products/ProductCard.jsx
import Image from 'next/image'
import Link from 'next/link'

// Helper function to format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price)
}

export default function ProductCard({ product }) {
  // Get the first image or a placeholder
  const imageUrl = product.product_images?.[0]?.image_url || '/placeholder.svg'
  const storeName = product.stores?.store_name || 'N/A'

  return (
    <Link href={`/product/${product.id}`} className="block group">
      <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="relative w-full h-48 bg-gray-200">
          <Image
            src={imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1">By {storeName}</p>
          <p className="text-lg font-bold text-indigo-600 mt-2">{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  )
}