// src/app/checkout/page.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Script from 'next/script' // ✅ 1. import Script
import { CreditCard, QrCode, Truck, MapPin, Loader2, ShieldCheck } from 'lucide-react'
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
  const [omiseLoaded, setOmiseLoaded] = useState(false) // เช็คว่า Script โหลดเสร็จยัง

  // Credit Card State
  const [ccInfo, setCcInfo] = useState({ number: '', name: '', expiry: '', cvv: '' })
  
  // QR Code Image (จาก Omise)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const [chargeId, setChargeId] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (cartItems.length === 0 && !authLoading) router.push('/cart')
  }, [user, authLoading, cartItems, router])

  // ✅ 2. ฟังก์ชันเรียก Omise Tokenization (แปลงข้อมูลบัตรเป็น Token)
  const createOmiseToken = () => {
    return new Promise((resolve, reject) => {
      const { number, name, expiry, cvv } = ccInfo
      const [expiration_month, expiration_year] = expiry.split('/')

      window.Omise.createToken('card', {
        name,
        number: number.replace(/\s/g, ''),
        expiration_month,
        expiration_year: `20${expiration_year}`, // แปลง YY เป็น YYYY
        security_code: cvv,
      }, (statusCode, response) => {
        if (statusCode === 200) {
          resolve(response.id) // ได้ Token ID มาแล้ว!
        } else {
          reject(new Error(response.message))
        }
      })
    })
  }

  // ✅ 3. ฟังก์ชันเรียก Omise Source (สำหรับ QR Code)
  const createOmiseSource = () => {
    return new Promise((resolve, reject) => {
      window.Omise.createSource('promptpay', {
        amount: totalAmount * 100,
        currency: 'THB'
      }, (statusCode, response) => {
        if (statusCode === 200) {
          resolve(response.id)
        } else {
          reject(new Error(response.message))
        }
      })
    })
  }

  const handlePlaceOrder = async () => {
    if (!shippingAddress || !phone) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'ระบุที่อยู่และเบอร์โทรให้ครบถ้วน' })
      return
    }

    setLoading(true)

    try {
      // --- PART 1: PAYMENT PROCESS ---
      if (paymentMethod !== 'cod') {
        let tokenId = null
        let sourceId = null

        // A. ถ้าจ่ายบัตรเครดิต -> สร้าง Token
        if (paymentMethod === 'credit_card') {
          tokenId = await createOmiseToken()
        } 
        // B. ถ้าจ่าย QR -> สร้าง Source
        else if (paymentMethod === 'qr_code') {
          sourceId = await createOmiseSource()
        }

        // C. ส่งไปตัดเงินที่ API หลังบ้านเรา
        const res = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: totalAmount, 
            tokenId, 
            sourceId 
          })
        })
        
        const { charge, message } = await res.json()
        if (!res.ok) throw new Error(message || 'Payment failed')

        // กรณี QR Code: ต้องเอาภาพ QR มาโชว์ให้ลูกค้าสแกนก่อน
        if (paymentMethod === 'qr_code' && charge.status === 'pending') {
          setQrCodeUrl(charge.source.scannable_code.image.download_uri)
          setChargeId(charge.id)
          setLoading(false)
          Swal.fire({ title: 'สแกน QR Code ด้านล่างเพื่อชำระเงิน', icon: 'info' })
          return // หยุด flow ไว้ตรงนี้ก่อน รอ User สแกนเสร็จค่อยว่ากัน (ใน Project จริงต้องใช้ Webhook หรือปุ่ม "ฉันโอนแล้ว")
        }

        // กรณีบัตรเครดิต: ถ้าตัดผ่าน (status: successful) ให้ไปต่อ
        if (paymentMethod === 'credit_card' && charge.status !== 'successful') {
           throw new Error('การชำระเงินไม่สำเร็จ กรุณาตรวจสอบวงเงินหรือลองบัตรอื่น')
        }
      }

      // --- PART 2: DATABASE UPDATE ---
      // เมื่อชำระเงินสำเร็จ (หรือเป็น COD) ให้บันทึกลง Database
      const { data: orderId, error } = await supabase.rpc('place_order', {
        p_user_id: user.id,
        p_shipping_address: shippingAddress,
        p_phone: phone,
        p_payment_method: paymentMethod
      })

      if (error) throw error

      await fetchCart()
      
      Swal.fire({
        icon: 'success',
        title: 'สั่งซื้อสำเร็จ!',
        text: 'ขอบคุณที่อุดหนุน Agri-Tech',
        timer: 2000,
        showConfirmButton: false,
        confirmButtonColor: '#2E7D32'
      }).then(() => {
        router.push(`/orders/${orderId}`)
      })

    } catch (err) {
      console.error(err)
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      if (!qrCodeUrl) setLoading(false)
    }
  }

  // ✅ ปุ่มยืนยันสำหรับ QR Code (แบบ Manual Check ง่ายๆ สำหรับโปรเจกต์)
  const handleConfirmQR = async () => {
    // ในระบบจริงต้องใช้ Webhook จาก Omise ยิงมาบอกว่าจ่ายแล้ว
    // แต่เพื่อความง่ายในโปรเจกต์ เราจะสมมติว่าลูกค้าจ่ายแล้ว ให้กดปุ่มยืนยันเอง
    setQrCodeUrl(null)
    setLoading(true)
    
    // เรียก Logic เดิมเพื่อบันทึกลง DB
    try {
        const { data: orderId, error } = await supabase.rpc('place_order', {
            p_user_id: user.id,
            p_shipping_address: shippingAddress,
            p_phone: phone,
            p_payment_method: 'qr_code'
        })
        if (error) throw error
        await fetchCart()
        router.push(`/orders/${orderId}`)
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message })
    }
  }

  if (authLoading || cartItems.length === 0) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading Checkout...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* ✅ Load Omise Script */}
      <Script 
        src="https://cdn.omise.co/omise.js" 
        onLoad={() => {
          window.Omise.setPublicKey(process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY)
          setOmiseLoaded(true)
        }}
      />

      <div className="container mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <span className="bg-agri-primary text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg shadow-agri-primary/30">✓</span>
          ยืนยันการสั่งซื้อ (Real Payment)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. ที่อยู่จัดส่ง (เหมือนเดิม) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-agri-primary" /> ที่อยู่จัดส่ง
              </h2>
              <div className="space-y-4">
                <textarea 
                  value={shippingAddress} 
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all resize-none"
                  rows="3"
                  placeholder="ที่อยู่จัดส่งสินค้า..."
                />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all"
                  placeholder="เบอร์โทรศัพท์"
                />
              </div>
            </div>

            {/* 2. วิธีการชำระเงิน */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="text-agri-primary" /> เลือกวิธีการชำระเงิน
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button onClick={() => {setPaymentMethod('qr_code'); setQrCodeUrl(null)}} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'qr_code' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100'}`}>
                  <QrCode size={28} /> <span className="font-bold text-sm">PromptPay QR</span>
                </button>
                <button onClick={() => {setPaymentMethod('credit_card'); setQrCodeUrl(null)}} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100'}`}>
                  <CreditCard size={28} /> <span className="font-bold text-sm">Credit Card</span>
                </button>
                <button onClick={() => {setPaymentMethod('cod'); setQrCodeUrl(null)}} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cod' ? 'border-agri-primary bg-green-50 text-agri-primary' : 'border-gray-100'}`}>
                  <Truck size={28} /> <span className="font-bold text-sm">COD</span>
                </button>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                {/* QR Code Section */}
                {paymentMethod === 'qr_code' && (
                  <div className="text-center animate-fade-in">
                    {qrCodeUrl ? (
                      <div>
                        <p className="text-agri-primary font-bold mb-2">สแกนเพื่อจ่ายเงิน ({formatPrice(totalAmount)})</p>
                        <div className="w-64 h-64 bg-white mx-auto p-2 rounded-lg shadow-sm mb-4 relative">
                           <Image src={qrCodeUrl} alt="Omise QR" fill className="object-contain" unoptimized />
                        </div>
                        <button onClick={handleConfirmQR} className="bg-agri-primary text-white px-6 py-2 rounded-lg hover:bg-agri-hover">
                            ฉันชำระเงินแล้ว
                        </button>
                        <p className="text-xs text-gray-400 mt-2">*ในระบบจริงจะตรวจสอบอัตโนมัติ</p>
                      </div>
                    ) : (
                      <p className="text-gray-600">กดปุ่ม "ชำระเงิน" เพื่อสร้าง QR Code</p>
                    )}
                  </div>
                )}

                {/* Credit Card Form */}
                {paymentMethod === 'credit_card' && (
                  <div className="space-y-3 animate-fade-in">
                    <input type="text" placeholder="หมายเลขบัตร (4242 4242... สำหรับ Test)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg" value={ccInfo.number} onChange={(e) => setCcInfo({...ccInfo, number: e.target.value})} maxLength="16" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg" value={ccInfo.expiry} onChange={(e) => setCcInfo({...ccInfo, expiry: e.target.value})} />
                      <input type="password" placeholder="CVV" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg" value={ccInfo.cvv} onChange={(e) => setCcInfo({...ccInfo, cvv: e.target.value})} maxLength="3" />
                    </div>
                    <input type="text" placeholder="ชื่อบนบัตร" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg" value={ccInfo.name} onChange={(e) => setCcInfo({...ccInfo, name: e.target.value})} />
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2"><ShieldCheck size={14} className="text-green-600"/> Secured by Omise</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (เหมือนเดิม) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">สรุปคำสั่งซื้อ</h3>
              {/* ... (รายการสินค้า เหมือนเดิม) ... */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-lg font-bold text-agri-primary pt-2 border-t border-gray-100 mt-2">
                  <span>ยอดสุทธิ</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {!qrCodeUrl && (
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !omiseLoaded}
                  className="w-full mt-6 py-3.5 bg-agri-primary text-white rounded-xl font-bold hover:bg-agri-hover transition-all shadow-lg shadow-agri-primary/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'ชำระเงิน'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}