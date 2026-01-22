// src/app/product/[id]/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { PackageCheck, PackageX } from 'lucide-react' // ✅ เพิ่มไอคอน

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

  if (loading) return <div className="text-center py-20 text-agri-primary animate-pulse">Loading...</div>
  if (error || !product) return <div className="text-center py-20 text-red-600">{error || 'Product not found'}</div>

  const images = product.product_images || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-gray-500">
        <Link href="/" className="hover:text-indigo-600">หน้าแรก</Link> / <Link href="/storefront" className="hover:text-indigo-600">สินค้าทั้งหมด</Link> / <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* 🖼️ Image Section */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border">
            {images.length > 0 ? (
              <Image
                src={images[selectedImage]?.image_url}
                alt={product.name}
                fill
                priority
                unoptimized
                className="object-contain p-2"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
            )}
          </div>
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
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span>โดย:</span>
              <Link href={`/store/${product.stores?.id}`} className="font-medium text-indigo-600 hover:underline">
                {product.stores?.store_name}
              </Link>
            </div>

            {/* ราคา */}
            <div className="text-4xl font-bold text-indigo-600 mb-4">
              {formatPrice(product.price)}
            </div>

            {/* ✅ เพิ่มส่วนแสดงสถานะสินค้าในสต็อก */}
            <div className="mb-4">
                {product.stock_quantity > 0 ? (
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                        <PackageCheck size={20} />
                        <span className="font-bold">มีสินค้าในสต็อก: {product.stock_quantity} ชิ้น</span>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200">
                        <PackageX size={20} />
                        <span className="font-bold">สินค้าหมดชั่วคราว</span>
                    </div>
                )}
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
    </div>
  )
}