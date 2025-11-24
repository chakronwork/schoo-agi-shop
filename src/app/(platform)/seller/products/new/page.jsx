// src/app/(platform)/seller/products/new/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Package, FileText, DollarSign, Image as ImageIcon, Save, ArrowLeft, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function NewProductPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [categoryId, setCategoryId] = useState('') 
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [categories, setCategories] = useState([])
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    fetchCategories()
  }, [user, authLoading])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name')
    if (data) setCategories(data)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'ไฟล์ใหญ่เกินไป', text: 'ขนาดรูปต้องไม่เกิน 2MB' })
        return
      }
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกรูปภาพ', text: 'สินค้าต้องมีรูปภาพประกอบอย่างน้อย 1 รูป' })
      return
    }
    setLoading(true)
    
    const formData = new FormData()
    formData.append('name', productName)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('stock_quantity', stock)
    formData.append('category_id', categoryId)
    formData.append('image', imageFile)

    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) throw new Error(result.message)

      Swal.fire({
        icon: 'success',
        title: 'ลงสินค้าสำเร็จ!',
        text: 'สินค้าของคุณพร้อมขายแล้ว',
        confirmButtonColor: '#2E7D32',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        router.push('/seller/dashboard')
      })

    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="flex justify-center items-center h-screen text-agri-primary animate-pulse">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white text-gray-600 shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ลงสินค้าใหม่</h1>
            <p className="text-gray-500">กรอกรายละเอียดสินค้าของคุณให้ครบถ้วน</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-agri-primary/30 rounded-xl bg-agri-pastel/20 hover:bg-agri-pastel/40 transition-colors cursor-pointer relative group">
              <input type="file" onChange={handleImageChange} accept="image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {previewUrl ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                    คลิกเพื่อเปลี่ยนรูป
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-agri-primary mx-auto mb-3 shadow-sm">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-agri-primary font-bold">คลิกเพื่ออัปโหลดรูปสินค้า</p>
                  <p className="text-sm text-gray-400 mt-1">รองรับ JPG, PNG (ไม่เกิน 2MB)</p>
                </div>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Package size={18}/> ชื่อสินค้า</label>
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="เช่น ปุ๋ยอินทรีย์ ตราใบไม้" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText size={18}/> รายละเอียด</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all resize-none" placeholder="อธิบายคุณสมบัติสินค้า..."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><DollarSign size={18}/> ราคา (บาท)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="0.00" />
              </div>
              
              {/* Stock */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Package size={18}/> จำนวนในคลัง</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all" placeholder="1" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">หมวดหมู่</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 transition-all bg-white">
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

          </div>

          {/* Submit Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-agri-primary text-white font-bold hover:bg-agri-hover shadow-lg shadow-agri-primary/30 transition-all flex items-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> ลงขายทันที</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}