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
  LayoutDashboard, FileText, Settings, LogOut, Trash2, Edit, CheckCircle, XCircle, Truck
} from 'lucide-react'
import Swal from 'sweetalert2'

// Helper Formatter
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
})
const formatPrice = (price) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  // Data States
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([]) // ✅ เก็บข้อมูลคำสั่งซื้อจริง
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'orders'
  const [stats, setStats] = useState({ totalSales: 0, activeProducts: 0, pendingOrders: 0 })

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user) fetchStoreAndData()
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
        // 2. ดึงสินค้า (Products)
        const { data: productsData } = await supabase
          .from('products')
          .select(`*, product_images (image_url)`)
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false })
        
        setProducts(productsData || [])

        // 3. ดึงรายการคำสั่งซื้อ (Orders) ที่มีสินค้าของร้านเรา
        // (Join order_items -> products -> filter store_id)
        const { data: orderItemsData } = await supabase
          .from('order_items')
          .select(`
            id, quantity, price_at_purchase,
            orders (
              id, status, created_at, shipping_address, payment_method,
              user_profiles (full_name, phone_number)
            ),
            products (id, name, image_url: product_images(image_url))
          `)
          .eq('products.store_id', storeData.id)
          .order('id', { ascending: false })

        // จัดกลุ่มข้อมูลให้ดูง่ายขึ้น
        const formattedOrders = orderItemsData?.map(item => ({
          itemId: item.id,
          orderId: item.orders.id,
          productName: item.products.name,
          productImage: item.products.image_url?.[0]?.image_url || '/placeholder.svg',
          quantity: item.quantity,
          totalPrice: item.quantity * item.price_at_purchase,
          status: item.orders.status,
          customer: item.orders.user_profiles?.full_name || 'ลูกค้าทั่วไป',
          date: item.orders.created_at,
          address: item.orders.shipping_address
        })) || []

        setOrders(formattedOrders)

        // 4. อัปเดต Stats
        setStats({
          totalSales: formattedOrders.reduce((sum, o) => sum + o.totalPrice, 0),
          activeProducts: productsData?.filter(p => p.status === 'available').length || 0,
          pendingOrders: formattedOrders.filter(o => o.status === 'pending').length
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ ฟังก์ชันอัปเดตสถานะคำสั่งซื้อ (กดปุ่มแล้วเปลี่ยนจริง)
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // อัปเดตหน้าจอทันทีไม่ต้องโหลดใหม่
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o))
      
      Swal.fire({
        icon: 'success',
        title: 'อัปเดตสถานะแล้ว',
        text: `เปลี่ยนสถานะเป็น ${newStatus} เรียบร้อย`,
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error) {
      Swal.fire('Error', error.message, 'error')
    }
  }

  const handleDeleteProduct = async (productId) => {
    /* ... (โค้ดลบสินค้าเหมือนเดิม) ... */
    const result = await Swal.fire({
        title: 'ลบสินค้า?',
        text: "สินค้าจะถูกลบออกจากร้านค้าถาวร",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ใช่, ลบเลย',
        cancelButtonText: 'ยกเลิก'
      })
  
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('products').delete().eq('id', productId)
          if (error) throw error
          
          setProducts(products.filter(p => p.id !== productId))
          Swal.fire('ลบสำเร็จ', 'สินค้าถูกลบแล้ว', 'success')
        } catch (error) {
          Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
        }
      }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="flex h-screen justify-center items-center text-agri-primary animate-pulse">Loading...</div>
  if (!store) return <div className="text-center py-20">กรุณาสมัครเปิดร้านค้า</div>

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 truncate">{store.store_name}</h2>
          <p className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block">Verified Seller</p>
        </div>
        <nav className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'products' ? 'bg-agri-pastel text-agri-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Package size={20} /> สินค้าทั้งหมด
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'orders' ? 'bg-agri-pastel text-agri-primary' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileText size={20} /> คำสั่งซื้อ 
            {stats.pendingOrders > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingOrders}</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl mt-4"><LogOut size={20} /> ออกจากระบบ</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">ยอดขายรวม</p>
            <p className="text-2xl font-bold text-agri-primary">{formatPrice(stats.totalSales)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">รอจัดส่ง</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pendingOrders} รายการ</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">สินค้าActive</p>
            <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
          </div>
        </div>

        {/* 📦 TAB: สินค้า */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">รายการสินค้า</h2>
              <Link href="/seller/products/new" className="bg-agri-primary text-white px-4 py-2 rounded-lg hover:bg-agri-hover flex items-center gap-2 font-bold text-sm">
                <Plus size={16} /> เพิ่มสินค้า
              </Link>
            </div>
            {/* ... (Product Table เดิม ใส่ตรงนี้ ผมย่อไว้นะครับ ใช้ของเดิมได้เลย) ... */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สินค้า</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ราคา</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สต็อก</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                            <Image src={product.product_images?.[0]?.image_url || '/placeholder.svg'} alt={product.name} fill className="object-cover" unoptimized />
                          </div>
                          <div className="text-sm font-bold text-gray-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-agri-primary font-bold">{formatPrice(product.price)}</td>
                      <td className="px-6 py-4 text-sm">{product.stock_quantity}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Link href={`/seller/products/${product.id}/edit`}><Edit size={18} className="text-indigo-500"/></Link>
                        <button onClick={() => handleDeleteProduct(product.id)}><Trash2 size={18} className="text-red-500"/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 📄 TAB: คำสั่งซื้อ (ใหม่!) */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">รายการคำสั่งซื้อล่าสุด</h2>
            </div>
            {orders.length === 0 ? (
              <div className="p-10 text-center text-gray-500">ยังไม่มีคำสั่งซื้อเข้ามา</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สินค้า</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ลูกค้า</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">ยอดรวม</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">สถานะ</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {orders.map((order) => (
                      <tr key={order.itemId} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                              <Image src={order.productImage} alt={order.productName} fill className="object-cover" unoptimized />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{order.productName}</div>
                              <div className="text-xs text-gray-500">x{order.quantity} • {formatDate(order.date)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="font-bold">{order.customer}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{order.address}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-agri-primary">{formatPrice(order.totalPrice)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {/* ✅ ปุ่ม Action เปลี่ยนสถานะจริง */}
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => updateOrderStatus(order.orderId, 'confirmed')}
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" 
                                title="ยืนยันออเดอร์"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button 
                                onClick={() => updateOrderStatus(order.orderId, 'shipped')}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" 
                                title="ส่งสินค้า"
                              >
                                <Truck size={18} />
                              </button>
                            )}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button 
                                onClick={() => updateOrderStatus(order.orderId, 'cancelled')}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" 
                                title="ยกเลิก"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}