// src/app/product/[id]/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'

// Helper function สำหรับจัดรูปแบบเงิน
const formatPrice = (price) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price)
}

// Helper function สำหรับจัดรูปแบบวันที่
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ฟังก์ชันแปลงคะแนนเป็นคำพูด
const getRatingLabel = (rating) => {
  const r = Math.round(rating)
  switch (r) {
    case 1: return 'แย่'
    case 2: return 'พอใช้'
    case 3: return 'ดี'
    case 4: return 'ดีมาก'
    case 5: return 'ดีเยี่ยม'
    default: return ''
  }
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
    if (productId) fetchProduct()
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
          product_location,
          status,
          created_at,
          stores ( 
            id, 
            store_name,
            store_description
          ),
          categories ( 
            id, 
            name
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
        if (error.code === 'PGRST116') throw new Error('Product not found')
        throw error
      }

      setProduct(data)
    } catch (err) {
      console.error('Error fetching product:', err.message || err)
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
      alert(`เพิ่ม ${product.name} ลงตะกร้าแล้ว!`)
      setQuantity(1) 
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
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

  if (loading) return <div className="text-center py-20 text-agri-primary animate-pulse">Loading...</div>
  if (error || !product) return <div className="text-center py-20 text-red-600">{error || 'Product not found'}</div>

  const images = product.product_images || []
  const averageRating = calculateAverageRating()
  const reviewCount = product.reviews?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link href="/" className="hover:text-indigo-600">หน้าแรก</Link> / <Link href="/storefront" className="hover:text-indigo-600">สินค้าทั้งหมด</Link> / <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* 🖼️ Image Section */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]?.image_url}
                alt={product.name}
                fill
                priority
                // ✅ ใส่ unoptimized
                unoptimized
                className="object-contain p-2"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-indigo-600' : 'border-transparent'
                  }`}
                >
                  <Image 
                    src={img.image_url} 
                    alt="Thumbnail" 
                    fill 
                    // ✅ ใส่ unoptimized
                    unoptimized
                    className="object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📝 Product Info Section */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            {/* ชื่อผู้ลงขาย */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>โดย:</span>
              <Link href={`/store/${product.stores?.id}`} className="font-medium text-indigo-600 hover:underline">
                {product.stores?.store_name}
              </Link>
            </div>

            {/* Rating */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">{renderStars(averageRating)}</div>
                <span className="text-sm text-gray-600">
                  {averageRating} ({reviewCount} รีวิว)
                </span>
              </div>
            )}

            {/* ราคา */}
            <div className="text-4xl font-bold text-indigo-600 mb-4">
              {formatPrice(product.price)}
            </div>

            {/* ที่อยู่ของสินค้า */}
            <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <svg className="w-5 h-5 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span className="font-semibold block text-gray-900 text-sm">ที่อยู่ของสินค้า:</span>
                <span className="text-sm">{product.product_location || 'ไม่ระบุพิกัด'}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">รายละเอียดสินค้า</h3>
            <p className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6 flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 hover:bg-gray-100 text-gray-600">-</button>
              <span className="px-4 py-2 font-medium border-x border-gray-300 min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="px-4 py-2 hover:bg-gray-100 text-gray-600">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock_quantity === 0}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-lg shadow-indigo-200"
            >
              {addingToCart ? 'กำลังเพิ่ม...' : (product.stock_quantity > 0 ? 'ใส่ตะกร้า' : 'สินค้าหมด')}
            </button>
          </div>
        </div>
      </div>

      {/* ⭐ Reviews Section */}
      <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">รีวิวจากผู้ซื้อ</h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm border">
              <span className="text-yellow-500 font-bold text-lg">★</span>
              <span className="font-bold text-gray-900">{averageRating}</span>
              <span className="text-gray-500 text-sm">({reviewCount} รีวิว)</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {product.reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ยังไม่มีรีวิวสินค้านี้ เป็นคนแรกที่รีวิวเลย!</p>
          ) : (
            product.reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                      {review.user_profiles?.full_name?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.user_profiles?.full_name || 'ผู้ใช้งานทั่วไป'}</p>
                      <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex text-yellow-400 mb-1 justify-end">{renderStars(review.rating)}</div>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {getRatingLabel(review.rating)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 pl-14">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}