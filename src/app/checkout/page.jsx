// src/app/checkout/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { CreditCard, QrCode, Truck, MapPin, Check, Loader2, ShieldCheck } from 'lucide-react'
import Swal from 'sweetalert2'

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

  // Mockup Credit Card State
  const [ccInfo, setCcInfo] = useState({ number: '', name: '', expiry: '', cvv: '' })

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (cartItems.length === 0 && !authLoading) router.push('/cart')
    
    // Auto-fill mock address if available (Feature ในอนาคตดึงจาก Profile)
    if (user) {
      // fetchProfileAddress() ...
    }
  }, [user, authLoading, cartItems, router])

  const handlePlaceOrder = async () => {
    if (!shippingAddress || !phone) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'ระบุที่อยู่และเบอร์โทรให้ครบถ้วน' })
      return
    }

    // Mockup: ตรวจสอบบัตรเครดิต
    if (paymentMethod === 'credit_card' && (!ccInfo.number || !ccInfo.cvv)) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลบัตรไม่ครบ', text: 'กรุณากรอกข้อมูลบัตรเครดิต (จำลอง)' })
      return
    }

    setLoading(true)

    try {
      // 1. เรียก RPC สร้าง Order จริงใน Database
      const { data: orderId, error } = await supabase.rpc('place_order', {
        p_user_id: user.id,
        p_shipping_address: shippingAddress,
        p_phone: phone,
        p_payment_method: paymentMethod
      })

      if (error) throw error

      // 2. จำลอง Delay การตัดเงิน (Mock Payment Processing)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3. สำเร็จ! เคลียร์ตะกร้าและไปหน้าใบเสร็จ
      await fetchCart()
      
      Swal.fire({
        icon: 'success',
        title: 'สั่งซื้อสำเร็จ!',
        text: 'ขอบคุณที่อุดหนุน Agri-Tech',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#2E7D32'
      }).then(() => {
        router.push(`/orders/${orderId}`)
      })

    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || cartItems.length === 0) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading Checkout...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <span className="bg-agri-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg shadow-agri-primary/30">✓</span>
          ยืนยันการสั่งซื้อ
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. ที่อยู่จัดส่ง */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-agri-primary" /> ที่อยู่จัดส่ง
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ที่อยู่ (บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์)</label>
                  <textarea 
                    value={shippingAddress} 
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all resize-none"
                    rows="3"
                    placeholder="เช่น 123 หมู่ 1 ต.หนองควาย อ.หางดง จ.เชียงใหม่ 50230"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>
            </div>

            {/* 2. วิธีการชำระเงิน */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="text-agri-primary" /> เลือกวิธีการชำระเงิน
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* QR Code Option */}
                <button 
                  onClick={() => setPaymentMethod('qr_code')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'qr_code' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100 hover:border-agri-accent'}`}
                >
                  <QrCode size={28} />
                  <span className="font-bold text-sm">Thai QR</span>
                </button>

                {/* Credit Card Option */}
                <button 
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100 hover:border-agri-accent'}`}
                >
                  <CreditCard size={28} />
                  <span className="font-bold text-sm">บัตรเครดิต/เดบิต</span>
                </button>

                {/* COD Option */}
                <button 
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100 hover:border-agri-accent'}`}
                >
                  <Truck size={28} />
                  <span className="font-bold text-sm">เก็บเงินปลายทาง</span>
                </button>
              </div>

              {/* Mockup Payment Forms */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                {paymentMethod === 'qr_code' && (
                  <div className="text-center animate-fade-in">
                    <p className="text-gray-600 mb-4">สแกน QR เพื่อชำระเงิน (จำลอง)</p>
                    <div className="w-48 h-48 bg-white mx-auto p-2 rounded-lg shadow-sm mb-2">
                      {/* Fake QR Image (ใช้ API สร้าง QR ฟรี) */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OrderPayment-${Date.now()}`} 
                        alt="Payment QR" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-400">ระบบจะตรวจสอบยอดเงินอัตโนมัติ</p>
                  </div>
                )}

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 animate-fade-in">
                    <input 
                      type="text" 
                      placeholder="หมายเลขบัตร" 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg" 
                      value={ccInfo.number}
                      onChange={(e) => setCcInfo({...ccInfo, number: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg"
                        value={ccInfo.expiry}
                        onChange={(e) => setCcInfo({...ccInfo, expiry: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="CVV" 
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg"
                        value={ccInfo.cvv}
                        onChange={(e) => setCcInfo({...ccInfo, cvv: e.target.value})}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="ชื่อบนบัตร" 
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg"
                      value={ccInfo.name}
                      onChange={(e) => setCcInfo({...ccInfo, name: e.target.value})}
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <ShieldCheck size={14} className="text-green-600"/> ข้อมูลของท่านถูกเข้ารหัสปลอดภัย 100% (Mockup)
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="text-center py-4 animate-fade-in">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Truck size={32} />
                    </div>
                    <p className="font-bold text-gray-800">เตรียมเงินสดให้พร้อม!</p>
                    <p className="text-sm text-gray-500">พนักงานขนส่งจะเก็บเงินเมื่อได้รับสินค้า</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปคำสั่งซื้อ</h3>
              
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                      <Image 
                        src={item.products.imageUrl} 
                        alt={item.products.name} 
                        fill 
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.products.name}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatPrice(item.products.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ยอดรวมสินค้า</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>ค่าจัดส่ง</span>
                  <span className="text-green-600 font-medium">ฟรี</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-agri-primary pt-2 border-t border-gray-100 mt-2">
                  <span>ยอดสุทธิ</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-6 py-3.5 bg-agri-primary text-white rounded-xl font-bold hover:bg-agri-hover transition-all shadow-lg shadow-agri-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'สั่งซื้อและชำระเงิน'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}