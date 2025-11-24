// src/app/(platform)/seller/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Package, Plus, DollarSign, Users, ShoppingBag, 
  LayoutDashboard, FileText, Settings, LogOut, Trash2, Edit
} from 'lucide-react'
import Swal from 'sweetalert2'

// Helper Icon สำหรับใช้ในหน้า (ถ้าไม่มี import มา)
function AlertTriangle({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  )
}

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalSales: 0, activeProducts: 0, lowStock: 0 })

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
        setProducts(productsData || [])

        // 3. คำนวณสถิติจากข้อมูลจริง
        const active = productsData?.filter(p => p.status === 'available').length || 0
        const lowStock = productsData?.filter(p => p.stock_quantity < 5).length || 0

        setStats({
          totalSales: 0, // ยังเป็น 0 จนกว่าจะเชื่อมระบบ Order Items
          activeProducts: active,
          lowStock: lowStock
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
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบสินค้า',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId)
        if (error) throw error
        setProducts(products.filter(p => p.id !== productId))
        Swal.fire('ลบสำเร็จ', 'สินค้าถูกลบเรียบร้อยแล้ว', 'success')
        // อัปเดต Stats
        setStats(prev => ({ ...prev, activeProducts: prev.activeProducts - 1 }))
      } catch (error) {
        Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading Dashboard...</div>

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-agri-pastel text-center max-w-md w-full">
          <div className="w-16 h-16 bg-agri-pastel text-agri-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">เปิดร้านค้าใหม่</h1>
          <p className="text-gray-500 mb-6">คุณยังไม่มีร้านค้าในระบบ ลงทะเบียนเปิดร้านเพื่อเริ่มขายสินค้าได้เลย</p>
          <button className="w-full bg-agri-primary text-white py-3 rounded-xl font-bold hover:bg-agri-hover transition-colors">
            ลงทะเบียนเปิดร้านค้า
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-agri-primary text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-md">
              {store.store_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 truncate max-w-[140px]">{store.store_name}</h2>
              <p className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">Verified Seller</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2 mt-2">การจัดการ</p>
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-agri-pastel text-agri-primary rounded-xl font-bold transition-colors">
            <Package size={20} /> สินค้าทั้งหมด
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-agri-primary rounded-xl transition-colors opacity-50 cursor-not-allowed">
            <FileText size={20} /> คำสั่งซื้อ (0)
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-agri-primary rounded-xl transition-colors opacity-50 cursor-not-allowed">
            <DollarSign size={20} /> การเงิน
          </a>
          <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2 mt-6">ตั้งค่า</p>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-agri-primary rounded-xl transition-colors opacity-50 cursor-not-allowed">
            <Settings size={20} /> ข้อมูลร้านค้า
          </a>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-4">
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการสินค้า</h1>
            <p className="text-gray-500 text-sm">จัดการสต็อกและสินค้าทั้งหมดของคุณ</p>
          </div>
          <Link 
            href="/seller/products/new" 
            className="bg-agri-primary text-white px-6 py-3 rounded-xl hover:bg-agri-hover transition-all flex items-center gap-2 font-bold shadow-lg shadow-agri-primary/30 transform hover:-translate-y-0.5"
          >
            <Plus size={20} /> ลงสินค้าใหม่
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><Package size={24}/></div>
            <div>
              <p className="text-sm text-gray-500">สินค้าพร้อมขาย</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activeProducts}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle size={24}/></div>
            <div>
              <p className="text-sm text-gray-500">สต็อกใกล้หมด</p>
              <p className="text-2xl font-bold text-gray-800">{stats.lowStock}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><DollarSign size={24}/></div>
            <div>
              <p className="text-sm text-gray-500">ยอดขายรวม</p>
              <p className="text-2xl font-bold text-gray-800">฿{stats.totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Package size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">ร้านของคุณยังว่างอยู่</h3>
              <p className="text-gray-500 mb-6">เริ่มลงสินค้าชิ้นแรกเพื่อเปิดการขาย</p>
              <Link href="/seller/products/new" className="text-agri-primary font-bold hover:underline">
                + ลงสินค้าตอนนี้
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สินค้า</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ราคา</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สต็อก</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 relative rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                            <Image 
                              src={product.product_images?.[0]?.image_url || '/placeholder.svg'} 
                              alt={product.name} 
                              fill 
                              sizes="48px"
                              unoptimized // ✅ ใส่บรรทัดนี้ครับ รับรองหาย Error ชัวร์!
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</div>
                            {/* ✅ Fix .slice Error */}
                            <div className="text-xs text-gray-500 font-mono">ID: {String(product.id).slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-agri-primary">
                        ฿{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${product.stock_quantity < 5 ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                          {product.stock_quantity} ชิ้น
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          product.status === 'available' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {product.status === 'available' ? 'พร้อมขาย' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                        <Link href={`/seller/products/${product.id}/edit`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="แก้ไข">
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}