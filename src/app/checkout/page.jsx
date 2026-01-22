// src/app/checkout/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { CreditCard, QrCode, Truck, MapPin, Loader2, ShieldCheck, Wallet } from 'lucide-react'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)
const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { cartItems, totalAmount, fetchCart } = useCart()
  const supabase = createClient()

  // Form States
  const [shippingAddress, setShippingAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('qr_code')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (cartItems.length === 0 && !authLoading) router.push('/cart')
    
    const fetchProfile = async () => {
        if(user) {
            const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
            if(data) {
                setShippingAddress(data.address || '')
                setPhone(data.phone_number || '')
            }
        }
    }
    fetchProfile()
  }, [user, authLoading, cartItems, router])

  const handlePlaceOrder = async () => {
    if (!shippingAddress || !phone) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'ระบุที่อยู่และเบอร์โทรให้ครบถ้วน' })
      return
    }

    setLoading(true)

    try {
      // 1. ถ้าเลือกจ่าย QR Code
      if (paymentMethod === 'qr_code') {
        // เรียก API ปลอมที่เราทำไว้
        const res = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount, method: 'promptpay' })
        })
        const data = await res.json()

        // ดึงรูป QR จากข้อมูลหลอกๆ ที่ส่งกลับมา
        const qrImage = data.charge.source.scannable_code.image.download_uri

        // เด้ง Popup QR Code
        const result = await MySwal.fire({
          title: 'สแกนจ่ายเงิน (Mockup)',
          text: 'นี่คือการจำลอง ระบบจะถือว่าจ่ายสำเร็จทันทีที่กดปุ่ม',
          imageUrl: qrImage,
          imageWidth: 200,
          imageHeight: 200,
          imageAlt: 'QR Code',
          showCancelButton: true,
          confirmButtonText: 'จำลองการจ่ายเงินสำเร็จ',
          cancelButtonText: 'ยกเลิก',
          confirmButtonColor: '#2E7D32',
          allowOutsideClick: false
        })

        if (!result.isConfirmed) {
          setLoading(false)
          return // ถ้ายกเลิกก็หยุดตรงนี้
        }
      } 
      else if (paymentMethod !== 'cod') {
         // จำลองโหลดนิดหน่อยสำหรับบัตรเครดิต
         await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // 2. บันทึกลง Database (เหมือนเดิม)
      const { data: orderId, error } = await supabase.rpc('place_order', {
        p_user_id: user.id,
        p_shipping_address: shippingAddress,
        p_phone: phone,
        p_payment_method: paymentMethod
      })

      if (error) throw error

      // ถ้าไม่ใช่ COD (คือจ่าย QR หรือบัตร) ให้อัปเดตสถานะเป็น confirmed เลย
      if (paymentMethod !== 'cod') {
          await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId)
      }

      await fetchCart() // ล้างตะกร้า
      
      Swal.fire({
        icon: 'success',
        title: 'สั่งซื้อสำเร็จ!',
        text: 'ระบบได้รับคำสั่งซื้อเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
      }).then(() => {
        router.push(`/orders/${orderId}`)
      })

    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || cartItems.length === 0) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading Checkout...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 border-b pb-4 bg-white p-4 rounded-t-xl shadow-sm">
            <div className="text-agri-primary font-bold text-xl flex items-center gap-2">
                <ShieldCheck size={24}/> Checkout
            </div>
            <div className="h-6 w-[1px] bg-gray-300"></div>
            <div className="text-gray-500 text-sm">ทำการสั่งซื้อ</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Input Forms */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* 1. ที่อยู่จัดส่ง */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 text-agri-primary">
                <MapPin size={20} /> ที่อยู่ในการจัดส่ง
              </h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">ชื่อ-สกุล / ที่อยู่</label>
                    <textarea 
                    value={shippingAddress} 
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-agri-primary text-sm resize-none"
                    rows="3"
                    placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">เบอร์โทรศัพท์</label>
                    <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-agri-primary text-sm"
                    placeholder="08x-xxx-xxxx"
                    />
                </div>
              </div>
            </div>

            {/* 2. รายการสินค้า */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 text-agri-primary">
                    <Truck size={20} /> รายการสินค้า
                </h2>
                <div className="space-y-4 divide-y divide-gray-100">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 pt-4 first:pt-0">
                            <div className="w-16 h-16 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                                <Image src={item.products.imageUrl} alt={item.products.name} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{item.products.name}</h3>
                                <p className="text-xs text-gray-500">จำนวน: {item.quantity} ชิ้น</p>
                                <p className="text-sm font-bold text-agri-primary mt-1">{formatPrice(item.products.price * item.quantity)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. วิธีการชำระเงิน */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2 text-agri-primary">
                <Wallet size={20} /> เลือกวิธีการชำระเงิน
              </h2>
              
              <div className="space-y-3">
                {/* QR Code */}
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'qr_code' ? 'border-agri-primary bg-green-50/50 ring-1 ring-agri-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value="qr_code" checked={paymentMethod === 'qr_code'} onChange={() => setPaymentMethod('qr_code')} className="accent-agri-primary w-5 h-5" />
                    <div className="bg-white p-2 rounded border border-gray-200"><QrCode size={24} className="text-gray-700"/></div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">QR PromptPay</p>
                        <p className="text-xs text-gray-500">จำลองการสแกนจ่าย (ไม่ต้องโอนจริง)</p>
                    </div>
                </label>

                {/* Credit Card */}
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-agri-primary bg-green-50/50 ring-1 ring-agri-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value="credit_card" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="accent-agri-primary w-5 h-5" />
                    <div className="bg-white p-2 rounded border border-gray-200"><CreditCard size={24} className="text-blue-600"/></div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">บัตรเครดิต / เดบิต</p>
                        <p className="text-xs text-gray-500">จำลองการตัดบัตร</p>
                    </div>
                </label>

                {/* COD */}
                <label className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-agri-primary bg-green-50/50 ring-1 ring-agri-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-agri-primary w-5 h-5" />
                    <div className="bg-white p-2 rounded border border-gray-200"><Truck size={24} className="text-orange-500"/></div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800">เก็บเงินปลายทาง (COD)</p>
                        <p className="text-xs text-gray-500">จ่ายเงินสดเมื่อได้รับของ</p>
                    </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Summary & Button */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-6">สรุปยอดชำระ</h3>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>ยอดรวมสินค้า ({cartItems.length} ชิ้น)</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className="text-green-600 font-medium">ฟรี</span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-4"></div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-gray-800 text-base">ยอดรวมทั้งสิ้น</span>
                  <span className="font-extrabold text-2xl text-agri-primary">{formatPrice(totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-400 text-right">(รวมภาษีมูลค่าเพิ่มแล้ว)</p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-4 bg-agri-primary text-white rounded-xl font-bold hover:bg-agri-hover transition-all shadow-lg shadow-agri-primary/30 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'สั่งสินค้า (Mockup)'}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <ShieldCheck size={12}/> ข้อมูลปลอดภัย (Mockup Mode)
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}