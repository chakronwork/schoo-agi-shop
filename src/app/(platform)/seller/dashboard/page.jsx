// src/app/(platform)/seller/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Package, Plus, DollarSign, Users, ShoppingBag 
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // ✅ เปลี่ยนเป็น State สำหรับเก็บค่าจริง (เริ่มต้นที่ 0)
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalVisitors: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchStoreAndData()
    }
  }, [user, authLoading])

  const fetchStoreAndData = async () => {
    try {
      // 1. ดึงข้อมูลร้านค้า
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (storeError && storeError.code !== 'PGRST116') throw storeError
      setStore(storeData)

      if (storeData) {
        // 2. ดึงสินค้า
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`*, product_images (image_url)`)
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })

        if (productsError) throw productsError
        setProducts(productsData)

        // 3. 📊 คำนวณยอดขายจริง (Real Data Calculation)
        // ดึงรายการสินค้าที่ขายได้ของร้านนี้
        const { data: salesData } = await supabase
          .from('order_items')
          .select(`
            quantity,
            price_at_purchase,
            products!inner (store_id)
          `)
          .eq('products.store_id', storeData.id)
        
        // คำนวณยอดรวม
        const totalSales = salesData?.reduce((sum, item) => sum + (item.quantity * item.price_at_purchase), 0) || 0
        const totalOrders = salesData?.length || 0 // นับจำนวนรายการที่ขายออกไป

        setStats({
          totalSales: totalSales,
          pendingOrders: 0, // (ต้อง join ตาราง orders เพื่อเช็ค status ซึ่งซับซ้อน ไว้ทำเฟสหน้า ใส่ 0 ไว้ก่อน)
          totalVisitors: 0  // (ระบบเรายังไม่มีตัวนับคนเข้าชม ใส่ 0 ไว้ก่อน)
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "สินค้าจะถูกลบออกจากร้านค้าถาวร",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบสินค้า',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId)
        if (error) throw error
        setProducts(products.filter(p => p.id !== productId))
        Swal.fire('ลบสำเร็จ', 'สินค้าถูกลบเรียบร้อยแล้ว', 'success')
      } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
      }
    }
  }

  if (loading) return <div className="p-10 text-center text-agri-primary animate-pulse">กำลังโหลดข้อมูล...</div>

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-lg border border-agri-pastel max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">ยังไม่มีร้านค้า</h1>
          <p className="text-gray-500 mb-8">กรุณาสมัครเปิดร้านค้าเพื่อเริ่มต้นใช้งาน</p>
          {/* ปุ่มนี้อาจจะพาไปหน้าสมัครจริง หรือถ้ายังไม่มีหน้าสมัครก็ disable ไว้ */}
          <button disabled className="bg-gray-300 text-white px-8 py-3 rounded-xl cursor-not-allowed font-bold">
            เปิดรับสมัครเร็วๆ นี้
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-agri-primary text-white py-10 px-4 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingBag className="text-agri-warning" /> Seller Center
            </h1>
            <p className="text-green-100 mt-1">ร้านค้า: <span className="font-bold text-white underline">{store.store_name}</span></p>
          </div>
          <Link 
            href="/seller/products/new" 
            className="bg-white text-agri-primary px-6 py-3 rounded-xl hover:bg-green-50 transition-all flex items-center gap-2 font-bold shadow-lg"
          >
            <Plus size={20} /> ลงสินค้าใหม่
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8">
        
        {/* 📊 Stats (Real Data - เริ่มต้นที่ 0) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-1">ยอดขายรวม</p>
                <h3 className="text-3xl font-bold text-gray-800">฿{stats.totalSales.toLocaleString()}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><DollarSign size={24}/></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-1">รอจัดส่ง</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.pendingOrders}</h3>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><Package size={24}/></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-1">ผู้เข้าชม</p>
                <h3 className="text-3xl font-bold text-gray-800">{stats.totalVisitors}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Users size={24}/></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 px-2">เมนูจัดการร้าน</h3>
              <ul className="space-y-1">
                <li>
                  <button className="w-full text-left px-4 py-2.5 bg-agri-pastel text-agri-primary rounded-xl font-bold">
                    📦 สินค้าทั้งหมด ({products.length})
                  </button>
                </li>
                {/* เมนูอื่นๆ ใส่ไว้แต่กดไม่ได้ หรือกดแล้วไม่มีอะไรเกิดขึ้น (No Fake Data) */}
                <li className="opacity-50 cursor-not-allowed px-4 py-2.5 text-gray-400">รายการคำสั่งซื้อ (0)</li>
                <li className="opacity-50 cursor-not-allowed px-4 py-2.5 text-gray-400">การเงิน</li>
                <li className="opacity-50 cursor-not-allowed px-4 py-2.5 text-gray-400">ตั้งค่าร้านค้า</li>
              </ul>
            </div>
          </div>

          {/* Main Content: Product List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Package className="text-agri-primary" /> รายการสินค้า
                </h2>
                <span className="text-sm text-gray-500">ทั้งหมด {products.length} รายการ</span>
              </div>
              
              {products.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package size={40} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 mb-6">ร้านว่างเปล่า... ยังไม่มีสินค้า</p>
                  <Link href="/seller/products/new" className="text-agri-primary font-bold hover:underline">
                    + เริ่มลงขายสินค้า
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สินค้า</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ราคา</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สต็อก</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สถานะ</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-12 w-12 flex-shrink-0 relative rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                <Image 
                                  src={product.product_images?.[0]?.image_url || '/placeholder.svg'} 
                                  alt={product.name} 
                                  fill 
                                  className="object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</div>
                                {/* ✅ แก้ไข: แปลง ID เป็น String ก่อน Slice */}
                                <div className="text-xs text-gray-500">ID: {String(product.id).slice(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-agri-primary">
                            ฿{product.price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.stock_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status === 'available' ? 'ขายอยู่' : 'หมด'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              ลบ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}