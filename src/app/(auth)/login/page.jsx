// app/(auth)/login/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sprout, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: error.message,
        confirmButtonColor: '#d33'
      })
      setLoading(false)
    } else {
      // ✅ เพิ่ม Logic เช็ค Role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      const role = profile?.role || 'buyer'
      
      Swal.fire({
        icon: 'success',
        title: 'ยินดีต้อนรับกลับ!',
        timer: 1500,
        showConfirmButton: false
      })

      // ✅ Redirect ไปตาม Role
      setTimeout(() => {
        if (role === 'admin') router.push('/admin/dashboard')
        else if (role === 'seller') router.push('/seller/dashboard')
        else router.push('/storefront') // หรือหน้าแรก
        
        router.refresh()
      }, 1000)
    }
  }

  // ✅ ฟังก์ชัน Login ด้วย Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: error.message })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-agri-pastel p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-white/50">
        
        {/* Header */}
        <div className="bg-agri-primary p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white text-agri-primary rounded-full mb-4 shadow-lg">
            <Sprout size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white">Agri-Tech</h2>
          <p className="text-green-100 text-sm mt-1">ตลาดซื้อขายสินค้าเกษตรออนไลน์</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">เข้าสู่ระบบ</h3>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 focus:border-agri-primary transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 focus:border-agri-primary transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-agri-primary text-white font-bold rounded-xl hover:bg-agri-hover shadow-lg shadow-agri-primary/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>เข้าสู่ระบบ <ArrowRight size={20} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือดำเนินการต่อด้วย</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <div className="mt-8 text-center text-sm text-gray-500">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link href="/register" className="font-bold text-agri-primary hover:underline">
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}