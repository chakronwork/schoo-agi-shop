// src/app/cart/page.jsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect } from 'react'
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'

const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)

export default function CartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { cartItems, loading: cartLoading, error, itemCount, totalAmount, updateItemQuantity, removeItem } = useCart()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Swal.fire({ icon: 'warning', title: 'ตะกร้าว่างเปล่า', text: 'กรุณาเลือกสินค้าก่อนชำระเงิน', confirmButtonColor: '#2E7D32' })
      return
    }
    // ✅ ไปหน้า Checkout ของจริงแล้ว!
    router.push('/checkout')
  }

  const handleRemove = (id) => {
    Swal.fire({
      title: 'ลบสินค้า?',
      text: "สินค้านี้จะถูกลบออกจากตะกร้า",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบเลย',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        removeItem(id)
        Swal.fire({ title: 'ลบแล้ว!', icon: 'success', timer: 1000, showConfirmButton: false })
      }
    })
  }

  if (authLoading || cartLoading) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading Cart...</div>

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-4 border border-red-200">เกิดข้อผิดพลาด: {error}</div>

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-agri-pastel text-center max-w-md w-full">
          <div className="w-24 h-24 bg-agri-pastel text-agri-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShoppingBag size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ตะกร้าของคุณว่างเปล่า</h2>
          <p className="text-gray-500 mb-8">เลือกซื้อสินค้าเกษตรคุณภาพดีได้ที่หน้าร้านค้า</p>
          <button
            onClick={() => router.push('/storefront')}
            className="w-full py-3.5 bg-agri-primary text-white font-bold rounded-xl hover:bg-agri-hover transition-all shadow-lg shadow-agri-primary/30 flex items-center justify-center gap-2"
          >
            ไปเลือกซื้อสินค้า <ArrowRight size={20}/>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <ShoppingBag className="text-agri-primary" /> ตะกร้าสินค้า ({itemCount})
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items List */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md">
                
                {/* Image */}
                <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100 flex-shrink-0">
                  <Image
                    src={item.products.imageUrl}
                    alt={item.products.name}
                    fill
                    className="object-cover"
                    unoptimized // ✅ แก้ปัญหารูปไม่ขึ้น
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-800 line-clamp-2 text-lg">{item.products.name}</h3>
                    <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                      <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-200 rounded-l-lg text-gray-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 font-bold text-gray-800 min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-200 rounded-r-lg text-gray-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="font-bold text-xl text-agri-primary">{formatPrice(item.products.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-6">สรุปยอดรวม</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>ยอดรวมสินค้า</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className="text-green-600 font-medium">ฟรี</span>
                </div>
                <div className="border-t border-gray-100 my-2 pt-2"></div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-800 text-lg">ยอดสุทธิ</span>
                  <span className="font-extrabold text-3xl text-agri-primary">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-agri-primary text-white font-bold rounded-xl hover:bg-agri-hover transition-all shadow-lg shadow-agri-primary/30 flex items-center justify-center gap-2 text-lg transform active:scale-95"
              >
                ชำระเงิน <ArrowRight size={24} />
              </button>

              <button
                onClick={() => router.push('/storefront')}
                className="w-full mt-3 py-3 text-gray-500 font-medium hover:text-agri-primary transition-colors text-sm"
              >
                เลือกซื้อสินค้าต่อ
              </button>
              
              <div className="mt-6 flex items-center gap-2 justify-center text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
                <AlertCircle size={14} /> ปลอดภัยด้วยระบบเข้ารหัส SSL
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}