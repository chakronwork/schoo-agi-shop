// src/components/common/Navbar.jsx

'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext' // 1. Import useCart
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ไอคอนตะกร้าสินค้า (SVG)
const CartIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="w-6 h-6"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" 
    />
  </svg>
)

export default function Navbar() {
  const { user, loading: authLoading } = useAuth() // เปลี่ยนชื่อ loading เป็น authLoading
  const { itemCount, loading: cartLoading } = useCart() // 2. Get itemCount และ loading
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-gray-800">
          Agri-Tech
        </Link>
        <div className="flex items-center space-x-4">
          {authLoading ? ( // 3. ใช้ authLoading
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          ) : user ? (
            <>
              {/* 4. เพิ่ม Link ตะกร้าสินค้า */}
              <Link 
                href="/cart" 
                className="relative text-gray-700 hover:text-indigo-600"
              >
                <CartIcon />
                {!cartLoading && itemCount > 0 && (
                  <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {itemCount}
                  </span>
                )}
              </Link>

              <span className="text-gray-700 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-indigo-600">
                Login
              </Link>
              <Link href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}