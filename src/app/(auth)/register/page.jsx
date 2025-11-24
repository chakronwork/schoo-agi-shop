// src/app/(auth)/register/page.jsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sprout, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'ลงทะเบียนไม่สำเร็จ',
        text: error.message,
        confirmButtonColor: '#d33'
      })
    } else {
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน',
        confirmButtonColor: '#2E7D32'
      })
    }
    setLoading(false)
  }

  // ✅ ฟังก์ชัน Login ด้วย Google (ใช้ได้เหมือนกัน)
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
          <h2 className="text-3xl font-bold text-white">สร้างบัญชีใหม่</h2>
          <p className="text-green-100 text-sm mt-1">เข้าร่วมชุมชน Agri-Tech วันนี้</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* ... (Form Inputs เดิม เหมือนเดิมเลยครับ) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">ชื่อ-นามสกุล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><User size={18} /></div>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="สมชาย ใจดี" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">อีเมล</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="example@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3.5 bg-agri-primary text-white font-bold rounded-xl hover:bg-agri-hover shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" /> : <>สมัครสมาชิก <ArrowRight size={20} /></>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">หรือสมัครด้วย</span></div>
          </div>

          {/* Google Button */}
          <button onClick={handleGoogleLogin} className="w-full py-3 border border-gray-300 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-medium text-gray-700">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>

          <div className="mt-8 text-center text-sm text-gray-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="font-bold text-agri-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}