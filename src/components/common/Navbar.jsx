// src/components/common/Navbar.jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, Menu, X, Search, User, LogOut, Sprout, 
  LayoutDashboard, Store, ChevronDown, PlusCircle, Shield, Settings 
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function Navbar() {
  const { user, loading: authLoading } = useAuth()
  const { itemCount, loading: cartLoading } = useCart()
  const supabase = createClient()
  const router = useRouter()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('บัญชีของฉัน')
  const [userRole, setUserRole] = useState(null)
  const [demoRole, setDemoRole] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const activeRole = demoRole || userRole

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        let initialName = user.user_metadata?.full_name || user.email?.split('@')[0]
        
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data) {
          if (data.full_name) setDisplayName(data.full_name)
          if (data.role) setUserRole(data.role)
        } else if (initialName) {
          setDisplayName(initialName)
        }
      } else {
        setDisplayName('บัญชีของฉัน')
        setUserRole(null)
        setDemoRole(null)
      }
    }
    fetchProfile()
  }, [user, supabase])

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
      setUserRole(null)
      setDemoRole(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/storefront?q=${encodeURIComponent(searchQuery)}`)
      setIsMenuOpen(false)
    }
  }

  const switchDemoRole = (role) => {
    setDemoRole(role)
    const roleName = role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : role === 'seller' ? 'ผู้ขาย (Seller)' : 'ลูกค้า (User)'
    Swal.fire({
        icon: 'success',
        title: 'เปลี่ยนสถานะสำเร็จ',
        text: `ตอนนี้คุณกำลังใช้งานในฐานะ: ${roleName}`,
        timer: 1500,
        showConfirmButton: false
    })
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

          {/* Search Bar */}
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
                className="flex-1 px-4 py-2 text-gray-700 focus:outline-none text-gray-800"
              />
              <button type="submit" className="bg-agri-warning hover:bg-orange-600 text-white px-5 transition-colors">
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* 🛠️ DEV TOOL: Demo Mode Switcher */}
            {user && (
              <div className="relative group mr-2">
                <button className="p-1.5 bg-gray-700/50 hover:bg-gray-700 rounded text-yellow-300 border border-yellow-300/30" title="Demo: เปลี่ยน Role">
                    <Settings size={18} />
                </button>
                {/* ✅ แก้ไข: เพิ่ม pt-2 เพื่อสร้างสะพานล่องหน (Invisible Bridge) */}
                <div className="absolute top-full right-0 pt-2 w-40 hidden group-hover:block z-50">
                    <div className="bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100">
                        <div className="px-3 py-2 bg-gray-100 text-xs font-bold text-gray-500">จำลองสถานะ (Demo)</div>
                        <button onClick={() => switchDemoRole('admin')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2">
                            <Shield size={14} className="text-blue-600"/> Admin Mode
                        </button>
                        <button onClick={() => switchDemoRole('seller')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2">
                            <Store size={14} className="text-green-600"/> Seller Mode
                        </button>
                        <button onClick={() => switchDemoRole(null)} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2">
                            <User size={14} className="text-gray-600"/> User Mode
                        </button>
                    </div>
                </div>
              </div>
            )}

            {authLoading ? (
              <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
            ) : user ? (
              <>
                {/* 👑 Admin Menu */}
                {activeRole === 'admin' && (
                  <div className="hidden md:block relative group">
                    <button className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm font-bold transition-colors border border-gray-600 shadow-sm">
                      <Shield size={16} /> Admin <ChevronDown size={14} />
                    </button>
                    {/* ✅ แก้ไข: ใช้ pt-2 แทน mt-2 เพื่อให้เมาส์ลากผ่านได้ไม่สะดุด */}
                    <div className="absolute top-full right-0 pt-2 w-48 hidden group-hover:block z-50">
                      <div className="bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm font-medium">
                          <LayoutDashboard size={16} className="text-blue-600"/> แดชบอร์ด
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🏪 Seller Menu */}
                {activeRole === 'seller' && (
                  <div className="hidden md:block relative group">
                    <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-sm font-bold transition-colors border border-white/20">
                      <Store size={16} /> ร้านค้า <ChevronDown size={14} />
                    </button>
                    {/* ✅ แก้ไข: ใช้ pt-2 แทน mt-2 */}
                    <div className="absolute top-full right-0 pt-2 w-56 hidden group-hover:block z-50">
                      <div className="bg-white text-gray-800 shadow-xl rounded-lg overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link href="/seller/dashboard" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm font-medium">
                          <LayoutDashboard size={16} className="text-agri-primary"/> ภาพรวมร้านค้า
                        </Link>
                        <Link href="/seller/products/new" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-sm font-medium border-t border-gray-100 text-green-700">
                          <PlusCircle size={16} /> ลงสินค้าใหม่
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <Link href="/profile" className="hidden md:flex flex-col items-start leading-tight hover:bg-agri-hover px-3 py-1.5 rounded-lg transition-colors">
                  <span className="text-[10px] text-gray-200 font-light">สวัสดี,</span>
                  <span className="text-sm font-bold flex items-center gap-1 max-w-[150px] truncate">
                    {displayName} {activeRole && <span className="text-[10px] bg-white/20 px-1 rounded ml-1">{activeRole}</span>}
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
                  <LogOut size={16} />
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

        {/* Mobile Search */}
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-agri-hover text-white border-t border-white/10 animate-fade-in">
          <div className="container mx-auto py-2">
            
            {/* Mobile Dev Tool */}
            {user && (
                <div className="flex gap-2 px-4 mb-2 overflow-x-auto pb-2">
                    <button onClick={() => switchDemoRole('admin')} className="text-xs bg-gray-800 text-yellow-300 px-2 py-1 rounded border border-yellow-300/30">Admin Mode</button>
                    <button onClick={() => switchDemoRole('seller')} className="text-xs bg-gray-800 text-green-300 px-2 py-1 rounded border border-green-300/30">Seller Mode</button>
                    <button onClick={() => switchDemoRole(null)} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-500/30">User Mode</button>
                </div>
            )}

            {user && (
              <div className="px-4 py-3 border-b border-white/10 mb-2">
                <p className="text-xs text-gray-300">ยินดีต้อนรับ</p>
                <p className="font-bold text-lg">{displayName}</p>
                {activeRole && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full uppercase">{activeRole}</span>}
              </div>
            )}
            
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">หน้าแรก</Link>
            <Link href="/storefront" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">สินค้าทั้งหมด</Link>
            
            {user && (
              <>
                {/* Mobile Admin Menu */}
                {activeRole === 'admin' && (
                  <div className="border-t border-white/10 mt-2 pt-2 bg-white/5">
                    <p className="px-4 text-xs text-yellow-300 font-bold mb-1">เมนูผู้ดูแลระบบ</p>
                    <Link 
                      href="/admin/dashboard" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 text-yellow-100"
                    >
                      <LayoutDashboard size={18} /> แดชบอร์ดแอดมิน
                    </Link>
                  </div>
                )}
                
                {/* Mobile Seller Menu */}
                {activeRole === 'seller' && (
                  <div className="border-t border-white/10 mt-2 pt-2 bg-white/5">
                    <p className="px-4 text-xs text-green-300 font-bold mb-1">เมนูร้านค้า</p>
                    <Link 
                      href="/seller/dashboard" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 text-green-100"
                    >
                      <LayoutDashboard size={18} /> ภาพรวมร้านค้า
                    </Link>
                    <Link 
                      href="/seller/products/new" 
                      onClick={() => setIsMenuOpen(false)} 
                      className="flex items-center gap-2 px-4 py-3 hover:bg-white/10 text-green-100"
                    >
                      <PlusCircle size={18} /> ลงสินค้าใหม่
                    </Link>
                  </div>
                )}

                <div className="border-t border-white/10 mt-2 pt-2">
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">ข้อมูลส่วนตัว</Link>
                  <Link href="/profile/orders" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">ประวัติคำสั่งซื้อ</Link>
                  <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-3 hover:bg-red-600/50 text-red-200 mt-2">
                    ออกจากระบบ
                  </button>
                </div>
              </>
            )}
            
            {!user && (
              <div className="border-t border-white/10 mt-2 pt-2">
                 <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10">เข้าสู่ระบบ</Link>
                 <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 hover:bg-white/10 font-bold text-agri-warning">สมัครสมาชิก</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}