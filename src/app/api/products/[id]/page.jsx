// src/app/product/[id]/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

const formatPrice = (price) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()
  const { addItem, loading: cartLoading } = useCart()

  const productId = params.id

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [productId])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          stock_quantity,
          status,
          created_at,
          stores ( 
            id, 
            store_name,
            store_description
          ),
          categories ( 
            id, 
            name,
            description
          ),
          product_images ( 
            id, 
            image_url 
          ),
          reviews (
            id,
            rating,
            comment,
            created_at,
            user_profiles ( 
              full_name 
            )
          )
        `)
        .eq('id', productId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Product not found')
        }
        throw error
      }

      setProduct(data)
    } catch (err) {
      console.error('Error fetching product:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setAddingToCart(true)
    try {
      await addItem(product.id, quantity)
      // Show success message
      alert(`Added ${quantity} ${product.name} to cart!`)
      setQuantity(1) // Reset quantity
    } catch (err) {
      alert('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const calculateAverageRating = () => {
    if (!product?.reviews || product.reviews.length === 0) return 0
    const sum = product.reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / product.reviews.length).toFixed(1)
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Link
            href="/storefront"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  const images = product.product_images || []
  const averageRating = calculateAverageRating()
  const reviewCount = product.reviews?.length || 0

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li>
            <Link href="/storefront" className="text-gray-500 hover:text-gray-700">Products</Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]?.image_url}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square bg-gray-100 rounded-md overflow-hidden border-2 ${
                    selectedImage === index ? 'border-indigo-600' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Title & Store */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center space-x-4 text-sm">
              <Link 
                href={`/store/${product.stores?.id}`}
                className="text-indigo-600 hover:text-indigo-700"
              >
                By {product.stores?.store_name}
              </Link>
              {product.categories && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600">{product.categories.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex">{renderStars(averageRating)}</div>
              <span className="text-sm text-gray-600">
                {averageRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="text-3xl font-bold text-indigo-600">
            {formatPrice(product.price)}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center space-x-2">
            {product.stock_quantity > 0 ? (
              <>
                <span className="inline-flex h-2 w-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-600">In Stock ({product.stock_quantity} available)</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-2 w-2 bg-red-500 rounded-full"></span>
                <span className="text-sm text-red-600">Out of Stock</span>
              </>
            )}
          </div>

          {/* Add to Cart Section */}
          {product.status === 'available' && product.stock_quantity > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center space-x-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.min(Math.max(1, val), product.stock_quantity))
                    }}
                    className="w-16 text-center border-x border-gray-300 py-2"
                    min="1"
                    max={product.stock_quantity}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="px-3 py-2 hover:bg-gray-100"
                    disabled={quantity >= product.stock_quantity}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || cartLoading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                >
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="border-t pt-6 space-y-2 text-sm text-gray-600">
            <p>SKU: PROD-{product.id}</p>
            <p>Added on {formatDate(product.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {reviewCount > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.user_profiles?.full_name || 'Anonymous'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}