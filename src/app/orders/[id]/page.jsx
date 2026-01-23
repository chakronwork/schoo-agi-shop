// src/app/orders/[id]/page.jsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Clock, Truck, Package, ArrowLeft } from 'lucide-react' // ❌ เอา Printer ออก

const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function OrderDetailPage({ params }) {
  const { id: orderId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user && orderId) fetchOrder()
  }, [user, authLoading, orderId])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, total_amount, status, shipping_address, payment_method, created_at,
          order_items (
            id, quantity, price_at_purchase,
            products (id, name, product_images ( image_url )),
            stores (store_name)
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen text-agri-primary animate-pulse">Loading Order...</div>
  if (!order) return <div className="text-center py-20">ไม่พบคำสั่งซื้อ</div>

  // Timeline Logic
  const steps = ['pending', 'confirmed', 'shipped', 'delivered']
  const currentStepIdx = steps.indexOf(order.status === 'cancelled' ? 'pending' : order.status)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        
        {/* Success Header */}
        <div className="bg-agri-primary text-white rounded-t-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white text-agri-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-in">
              <CheckCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">ขอบคุณสำหรับการสั่งซื้อ!</h1>
            <p className="text-green-100">หมายเลขคำสั่งซื้อ: #{order.id.toString().slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="bg-white rounded-b-3xl shadow-xl border-x border-b border-gray-200 p-8 relative">
          
          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div className="flex justify-between items-center mb-10 relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10"></div>
              <div className={`absolute top-1/2 left-0 h-1 bg-agri-primary -z-10 transition-all duration-1000`} style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}></div>
              
              {steps.map((step, idx) => (
                <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${idx <= currentStepIdx ? 'bg-agri-primary border-agri-primary text-white' : 'bg-white border-gray-200 text-gray-300'}`}>
                    {idx === 0 && <Clock size={14} />}
                    {idx === 1 && <CheckCircle size={14} />}
                    {idx === 2 && <Truck size={14} />}
                    {idx === 3 && <Package size={14} />}
                  </div>
                  <span className={`text-xs font-medium ${idx <= currentStepIdx ? 'text-agri-primary' : 'text-gray-400'}`}>
                    {step === 'pending' && 'รอชำระ'}
                    {step === 'confirmed' && 'ยืนยัน'}
                    {step === 'shipped' && 'ขนส่ง'}
                    {step === 'delivered' && 'สำเร็จ'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-dashed border-gray-200">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">วันที่สั่งซื้อ</p>
              <p className="text-gray-800 font-medium">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">วิธีการชำระเงิน</p>
              <p className="text-gray-800 font-medium capitalize">
                {order.payment_method === 'qr_code' && 'Thai QR Payment'}
                {order.payment_method === 'credit_card' && 'บัตรเครดิต/เดบิต'}
                {order.payment_method === 'cod' && 'เก็บเงินปลายทาง'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">ที่อยู่จัดส่ง</p>
              <p className="text-gray-800 font-medium">{order.shipping_address}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-8">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden relative border border-gray-100">
                    <Image 
                      src={item.products?.product_images?.[0]?.image_url || '/placeholder.svg'} 
                      alt="Product" 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.products?.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity} | {item.stores?.store_name}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800">{formatPrice(item.price_at_purchase * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-agri-pastel/30 p-4 rounded-xl flex justify-between items-center mb-8">
            <span className="text-agri-primary font-bold">ยอดสุทธิ</span>
            <span className="text-2xl font-extrabold text-agri-primary">{formatPrice(order.total_amount)}</span>
          </div>

          {/* Actions - เหลือปุ่มเดียว */}
          <div>
            <Link href="/storefront" className="w-full py-4 bg-agri-primary text-white rounded-xl text-center font-bold hover:bg-agri-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-agri-primary/30">
              <ArrowLeft size={18} /> ซื้อสินค้าต่อ
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
} 