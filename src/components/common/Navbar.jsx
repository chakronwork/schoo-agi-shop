// src/components/common/Navbar.jsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Menu, X, Search, User, LogOut, Sprout } from 'lucide-react'
import Swal from 'sweetalert2'

export default function Navbar() {
  const { user, loading: authLoading } = useAuth()
  const { itemCount, loading: cartLoading } = useCart()
  const supabase = createClient()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('บัญชีของฉัน')
  
  // ✅ เพิ่ม State สำหรับ Search
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user) {
        let initialName = user.user_metadata?.full_name || user.email?.split('@')[0]
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data?.full_name) {
          setDisplayName(data.full_name)
        } else if (initialName) {
          setDisplayName(initialName)
        }
      }
    }
    fetchProfileName()
  }, [user])

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2E7D32',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ออกเลย!',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
      setDisplayName('บัญชีของฉัน')
    }
  }

  // ✅ ฟังก์ชันค้นหา
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/storefront?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <nav className="bg-agri-primary text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Hamburger Menu */}
          <button 
            className="md:hidden p-2 hover:bg-agri-hover rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wide hover:opacity-90 transition-opacity">
            <div className="bg-white text-agri-primary p-1.5 rounded-full">
              <Sprout size={20} strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block">AI-Shop Electronics</span>
          </Link>

          {/* Search Bar (Desktop) - ✅ แก้ไขให้ใช้งานได้ */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch} className="flex w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center px-3 bg-gray-100 border-r text-gray-500 text-sm whitespace-nowrap">
                สินค้าทั้งหมด
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาอุปกรณ์การเกษตร..." 
                className="flex-1 px-4 py-2 text-gray-700 focus:outline-none"
              />
              <button type="submit" className="bg-agri-warning hover:bg-orange-600 text-white px-5 transition-colors">
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {authLoading ? (
              <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Link href="/profile" className="hidden md:flex flex-col items-start leading-tight hover:bg-agri-hover px-3 py-1.5 rounded-lg transition-colors">
                  <span className="text-[10px] text-gray-200 font-light">สวัสดี,</span>
                  <span className="text-sm font-bold flex items-center gap-1 max-w-[150px] truncate">
                    {displayName} <User size={14} />
                  </span>
                </Link>

                <Link href="/cart" className="relative p-2 hover:bg-agri-hover rounded-md transition-colors flex items-center">
                  <div className="relative">
                    <ShoppingCart size={26} />
                    {!cartLoading && itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-agri-warning text-xs font-bold text-white border-2 border-agri-primary">
                        {itemCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block font-bold text-sm ml-1 mt-3">ตะกร้า</span>
                </Link>

                <button 
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1 text-sm bg-red-600/90 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors ml-2"
                >
                  <LogOut size={16} /> ออก
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Link href="/login" className="hover:underline">เข้าสู่ระบบ</Link>
                <span className="h-4 w-px bg-white/40"></span>
                <Link href="/register" className="font-bold hover:underline">สมัครสมาชิก</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search - ✅ แก้ไขให้ใช้งานได้ */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearch} className="flex w-full bg-white rounded-lg overflow-hidden shadow-sm">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา..." 
              className="flex-1 px-4 py-2 text-gray-700 focus:outline-none"
            />
            <button type="submit" className="bg-agri-warning text-white px-4">
              <Search size={20} />
            </button>
          </form>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-agri-hover text-white border-t border-white/10 animate-fade-in">
          <div className="container mx-auto py-2">
            {user && (
              <div className="px-4 py-3 border-b border-white/10 mb-2">
                <p className="text-xs text-gray-300">ยินดีต้อนรับ</p>
                <p className="font-bold text-lg">{displayName}</p>
              </div>
            )}
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">หน้าแรก</Link>
            <Link href="/storefront" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">สินค้าทั้งหมด</Link>
            {user && (
              <>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">ข้อมูลส่วนตัว</Link>
                <Link href="/profile/orders" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">ประวัติคำสั่งซื้อ</Link>
                <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-3 hover:bg-red-600/50 text-red-200 mt-2 border-t border-white/10">
                  ออกจากระบบ
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}