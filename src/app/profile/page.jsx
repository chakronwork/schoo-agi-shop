// src/app/profile/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User, MapPin, Phone, Mail, Edit2, Save, X, Shield, Package, Map, Camera, KeyRound } from 'lucide-react'
import Swal from 'sweetalert2'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    postal_code: '',
  })

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) fetchProfile()
  }, [user, authLoading])

  const fetchProfile = async () => {
    try {
      // ✅ ใช้ maybeSingle() เพื่อแก้ปัญหา Error 406 กรณี User ใหม่ยังไม่มี Profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          email: user.email || '',
          phone_number: profile.phone_number || '',
          address: profile.address || '',
          city: profile.city || '',
          postal_code: profile.postal_code || '',
        })
      } else {
        setProfileData(prev => ({ ...prev, email: user.email || '' }))
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Update or Insert (Upsert)
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postal_code,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลส่วนตัวของคุณถูกอัปเดตแล้ว',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#2E7D32'
      })
      setIsEditing(false)
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.message,
        confirmButtonColor: '#2E7D32'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ตรงกัน', text: 'กรุณากรอกรหัสผ่านใหม่ให้ตรงกันทั้งสองช่อง' })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword })
      if (error) throw error

      Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', timer: 1500, showConfirmButton: false })
      setShowPasswordChange(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-[60vh] text-agri-primary animate-pulse">Loading Profile...</div>
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-agri-pastel rounded-full flex items-center justify-center text-agri-primary border-2 border-agri-primary">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">บัญชีของฉัน</h1>
          <p className="text-gray-500">จัดการข้อมูลส่วนตัวและการสั่งซื้อ</p>
        </div>
      </div>

      {/* Navigation Tabs (Custom Style) */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 mb-8 w-fit">
        <button className="px-6 py-2.5 rounded-lg text-sm font-bold bg-agri-pastel text-agri-primary flex items-center gap-2 shadow-sm">
          <User size={18} /> ข้อมูลส่วนตัว
        </button>
        <Link href="/profile/orders" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-agri-primary flex items-center gap-2 transition-all">
          <Package size={18} /> ประวัติคำสั่งซื้อ
        </Link>
        <Link href="/profile/addresses" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-agri-primary flex items-center gap-2 transition-all">
          <Map size={18} /> สมุดที่อยู่
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-agri-pastel rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-agri-primary"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-green-100 p-1.5 rounded-md text-agri-primary"><Edit2 size={18} /></span> 
                แก้ไขข้อมูล
              </h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm text-agri-primary font-bold hover:underline flex items-center gap-1">
                  แก้ไข
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><User size={14}/> ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Mail size={14}/> อีเมล</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><Phone size={14}/> เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin size={14}/> จังหวัด</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50 disabled:text-gray-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ที่อยู่</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    rows="2"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50 disabled:text-gray-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">รหัสไปรษณีย์</label>
                  <input
                    type="text"
                    value={profileData.postal_code}
                    onChange={(e) => setProfileData(prev => ({ ...prev, postal_code: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50 disabled:text-gray-500 transition-all"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); fetchProfile(); }}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium flex items-center gap-2 transition-colors"
                  >
                    <X size={18} /> ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 text-white bg-agri-primary hover:bg-agri-hover rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-agri-primary/30 transition-all disabled:opacity-70"
                  >
                    {saving ? 'กำลังบันทึก...' : <><Save size={18} /> บันทึกข้อมูล</>}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right: Sidebar Stats & Security */}
        <div className="space-y-6">
          {/* Security Card */}
          <div className="bg-white border border-agri-pastel rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-agri-warning" /> ความปลอดภัย
            </h3>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:text-agri-primary hover:border-agri-primary transition-all flex justify-between items-center group"
            >
              <span className="flex items-center gap-2"><KeyRound size={18}/> เปลี่ยนรหัสผ่าน</span>
              <span className="text-gray-400 group-hover:text-agri-primary">→</span>
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-2">
              <p>เข้าใช้งานล่าสุด: <span className="font-medium text-gray-700">{new Date().toLocaleDateString('th-TH')}</span></p>
              <p>สร้างบัญชีเมื่อ: <span className="font-medium text-gray-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString('th-TH') : 'N/A'}</span></p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-agri-primary to-green-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <h3 className="font-bold text-lg mb-4 relative z-10">ภาพรวมบัญชี</h3>
            <div className="space-y-3 relative z-10">
              <Link href="/profile/orders" className="flex justify-between items-center p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm">
                <span className="flex items-center gap-2"><Package size={16}/> คำสั่งซื้อทั้งหมด</span>
                <span>→</span>
              </Link>
              <Link href="/cart" className="flex justify-between items-center p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm">
                <span className="flex items-center gap-2"><Package size={16}/> สินค้าในตะกร้า</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal เปลี่ยนรหัสผ่าน */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl scale-100 animate-scale-in">
            <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
              <KeyRound className="text-agri-primary" /> เปลี่ยนรหัสผ่าน
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required minLength="6"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required minLength="6"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-accent/50"
                  placeholder="กรอกอีกครั้ง"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-agri-primary text-white rounded-xl hover:bg-agri-hover shadow-lg shadow-agri-primary/20"
                >
                  {saving ? 'กำลังเปลี่ยน...' : 'ยืนยันการเปลี่ยน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}