// src/app/(platform)/admin/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Users, ShoppingBag, DollarSign, 
  CheckCircle, XCircle, Search, MoreHorizontal, AlertTriangle
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function AdminDashboard() {
  const supabase = createClient()
  const [pendingSellers, setPendingSellers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeShops: 0,
    totalSales: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 1. ดึงรายการร้านค้าที่รออนุมัติ (Real Data)
      const { data: sellers } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 'pending')
      
      setPendingSellers(sellers || [])

      // 2. ดึงสถิติ (Count Real Data)
      // นับ User ทั้งหมด (user_profiles)
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // นับร้านค้าที่ Active
      const { count: shopCount } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')

      // รวมยอดขายทั้งหมด (จาก orders)
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
      
      const sales = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0

      setStats({
        totalUsers: userCount || 0,
        activeShops: shopCount || 0,
        totalSales: sales
      })

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (storeId) => {
    Swal.fire({
      title: 'อนุมัติร้านค้านี้?',
      text: "ร้านค้าจะสามารถเริ่มขายสินค้าได้ทันที",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2E7D32',
      confirmButtonText: 'ยืนยันอนุมัติ',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        // อัปเดตสถานะใน DB จริง
        const { error } = await supabase
          .from('stores')
          .update({ status: 'approved' })
          .eq('id', storeId)

        if (!error) {
          setPendingSellers(prev => prev.filter(s => s.id !== storeId))
          // อัปเดตตัวเลขร้านค้า Active ทันที
          setStats(prev => ({ ...prev, activeShops: prev.activeShops + 1 }))
          Swal.fire('เรียบร้อย', 'อนุมัติร้านค้าสำเร็จ', 'success')
        } else {
          Swal.fire('Error', error.message, 'error')
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden lg:block">
        <div className="p-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-green-400">
            <LayoutDashboard /> Admin
          </h2>
        </div>
        <nav className="mt-6">
          <a href="#" className="flex items-center px-6 py-3 bg-gray-800 border-r-4 border-green-500 text-white">
            <LayoutDashboard size={20} className="mr-3" /> ภาพรวมระบบ
          </a>
          {/* เมนูอื่นๆ ปิดไว้ก่อน */}
          <div className="px-6 py-3 text-gray-600 text-sm uppercase mt-4 font-bold">Menu (Coming Soon)</div>
          <div className="opacity-50">
            <a href="#" className="flex items-center px-6 py-3 text-gray-400 cursor-not-allowed"><Users size={20} className="mr-3" /> จัดการผู้ใช้</a>
            <a href="#" className="flex items-center px-6 py-3 text-gray-400 cursor-not-allowed"><ShoppingBag size={20} className="mr-3" /> สินค้า</a>
            <a href="#" className="flex items-center px-6 py-3 text-gray-400 cursor-not-allowed"><DollarSign size={20} className="mr-3" /> ธุรกรรม</a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Online
            </div>
          </div>
        </div>

        {/* Stats Cards (Real Data) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'ผู้ใช้งานทั้งหมด', value: stats.totalUsers, icon: <Users size={24}/>, color: 'bg-blue-500' },
            { title: 'ร้านค้า Active', value: stats.activeShops, icon: <ShoppingBag size={24}/>, color: 'bg-green-500' },
            { title: 'ยอดขายรวมทั้งหมด', value: `฿${stats.totalSales.toLocaleString()}`, icon: <DollarSign size={24}/>, color: 'bg-purple-500' },
            { title: 'คำขอเปิดร้าน', value: pendingSellers.length, icon: <AlertTriangle size={24}/>, color: 'bg-orange-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</h3>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white shadow-sm`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Approve Table (Real Data) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800">คำขอเปิดร้านค้า (รออนุมัติ)</h3>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อร้านค้า</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingSellers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    ไม่มีคำขอเปิดร้านค้าในขณะนี้
                  </td>
                </tr>
              ) : (
                pendingSellers.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{seller.store_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 truncate max-w-xs">{seller.store_description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(seller.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleApprove(seller.id)}
                        className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded hover:bg-green-100 transition-colors" 
                        title="อนุมัติ"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}