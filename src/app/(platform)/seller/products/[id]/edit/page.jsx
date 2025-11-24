// src/app/(platform)/seller/products/[id]/edit/page.jsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Package, FileText, DollarSign, Image as ImageIcon, Save, ArrowLeft, Loader2 } from 'lucide-react'
import Swal from 'sweetalert2'

export default function EditProductPage({ params }) {
  // แกะ params ด้วย React.use() สำหรับ Next.js 15+
  const { id: productId } = use(params)
  
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: ''
  })
  const [categories, setCategories] = useState([])
  const [currentImage, setCurrentImage] = useState(null)
  const [newImageFile, setNewImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user && productId) fetchData()
  }, [user, authLoading, productId])

  const fetchData = async () => {
    try {
      // 1. ดึงหมวดหมู่
      const { data: cats } = await supabase.from('categories').select('id, name')
      setCategories(cats || [])

      // 2. ดึงข้อมูลสินค้า
      const { data: product, error } = await supabase
        .from('products')
        .select(`*, product_images(image_url)`)
        .eq('id', productId)
        .single()

      if (error) throw error

      // เช็คว่าเป็นเจ้าของร้านไหม (Optional security check)
      // ... (ทำเพิ่มได้ถ้าต้องการความปลอดภัยสูง)

      setProductData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id
      })
      
      if (product.product_images?.length > 0) {
        setCurrentImage(product.product_images[0].image_url)
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่พบสินค้า', text: err.message })
      router.push('/seller/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'ไฟล์ใหญ่เกินไป', text: 'ขนาดรูปต้องไม่เกิน 2MB' })
        return
      }
      setNewImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 1. อัปเดตข้อมูลทั่วไป
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock_quantity: productData.stock_quantity,
          category_id: productData.category_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) throw updateError

      // 2. อัปเดตรูปภาพ (ถ้ามีการเปลี่ยน)
      if (newImageFile) {
        // อัปโหลดรูปใหม่
        const fileExt = newImageFile.name.split('.').pop()
        const fileName = `${productId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, newImageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        // ลบรูปเก่าใน DB และใส่รูปใหม่ (แบบง่าย: ลบหมดแล้ว insert ใหม่)
        await supabase.from('product_images').delete().eq('product_id', productId)
        await supabase.from('product_images').insert({
          product_id: productId,
          image_url: publicUrl,
          is_primary: true
        })
      }

      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#2E7D32'
      }).then(() => {
        router.push('/seller/dashboard')
      })

    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen text-agri-primary animate-pulse">Loading Data...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white text-gray-600 shadow-sm hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">แก้ไขสินค้า</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 space-y-6">
            
            {/* Image Upload */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-agri-primary/30 rounded-xl bg-agri-pastel/20 hover:bg-agri-pastel/40 transition-colors cursor-pointer relative group">
              <input type="file" onChange={handleImageChange} accept="image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              {previewUrl || currentImage ? (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img src={previewUrl || currentImage} alt="Product" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                    คลิกเพื่อเปลี่ยนรูปใหม่
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon size={32} className="mx-auto mb-3 text-agri-primary" />
                  <p className="text-agri-primary font-bold">คลิกเพื่ออัปโหลดรูป</p>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อสินค้า</label>
              <input type="text" value={productData.name} onChange={(e) => setProductData({...productData, name: e.target.value})} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">รายละเอียด</label>
              <textarea value={productData.description} onChange={(e) => setProductData({...productData, description: e.target.value})} rows="4" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">ราคา (บาท)</label>
                <input type="number" value={productData.price} onChange={(e) => setProductData({...productData, price: e.target.value})} required min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนในคลัง</label>
                <input type="number" value={productData.stock_quantity} onChange={(e) => setProductData({...productData, stock_quantity: e.target.value})} required min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">หมวดหมู่</label>
              <select value={productData.category_id} onChange={(e) => setProductData({...productData, category_id: e.target.value})} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-agri-primary/50 bg-white">
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-agri-primary text-white font-bold hover:bg-agri-hover shadow-lg shadow-agri-primary/30 transition-all flex items-center gap-2 disabled:opacity-70">
              {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> บันทึกการแก้ไข</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}