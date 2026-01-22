// src/app/storefront/page.jsx
'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/features/products/ProductCard'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Search, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal, Loader2, Sparkles, PackageX } from 'lucide-react'

function StorefrontContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [products, setProducts] = useState([])
  const [recommendedProducts, setRecommendedProducts] = useState([]) // ✅ สินค้าแนะนำ
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // State สำหรับ Input (แยกกับ URL เพื่อไม่ให้กระตุกเวลาพิมพ์)
  const [tempSearch, setTempSearch] = useState(searchParams.get('q') || '')
  
  // State สำหรับ Filter ที่เลือกจริง (ดึงจาก URL)
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentQuery = searchParams.get('q') || ''

  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // ✅ อัปเดต URL เมื่อกดค้นหาหรือเปลี่ยนฟิลเตอร์
  const updateURL = useCallback((updates = {}) => {
    const current = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) current.set(key, value)
      else current.delete(key)
    })
    const newUrl = `${pathname}?${current.toString()}`
    router.push(newUrl, { scroll: false })
  }, [pathname, router, searchParams])

  // ✅ 1. โหลดหมวดหมู่ และ สินค้าแนะนำ (ทำแค่ครั้งเดียวตอนเข้าหน้าเว็บ)
  useEffect(() => {
    const fetchInitialData = async () => {
      // ดึงหมวดหมู่
      const { data: catData } = await supabase.from('categories').select('id, name').order('name')
      if (catData) setCategories(catData)

      // ดึงสินค้าแนะนำ (สุ่ม 5 ชิ้นจากทั้งหมด ไม่สน Filter)
      const { data: recData } = await supabase
        .from('products')
        .select(`
             id, name, price, created_at, stock_quantity,
             stores ( id, store_name ),
             categories ( id, name ),
             product_images ( image_url ),
             reviews ( rating )
        `)
        .eq('status', 'available')
        .limit(20) // ดึงมาสัก 20 ตัวแล้วสุ่ม
      
      if (recData) {
        // คำนวณ Rating และสุ่ม
        const withRating = recData.map(p => ({
            ...p,
            avgRating: p.reviews?.length ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length : 0
        }))
        const shuffled = withRating.sort(() => 0.5 - Math.random())
        setRecommendedProducts(shuffled.slice(0, 5))
      }
    }
    fetchInitialData()
  }, []) // Empty dependency array = Run once

  // ✅ 2. โหลดสินค้าหลัก (ทำงานเมื่อ URL เปลี่ยน)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        let query = supabase.from('products').select(`
            id, name, price, created_at, stock_quantity,
            stores ( id, store_name ),
            categories ( id, name ),
            product_images ( image_url ),
            reviews ( rating )
          `).eq('status', 'available')

        // Apply Filters ตาม URL
        if (currentCategory) query = query.eq('category_id', currentCategory)
        if (currentMinPrice) query = query.gte('price', parseFloat(currentMinPrice))
        if (currentMaxPrice) query = query.lte('price', parseFloat(currentMaxPrice))
        if (currentQuery) query = query.ilike('name', `%${currentQuery}%`) // ค้นหาด้วย ilike (Case Insensitive)

        const { data } = await query

        if (data) {
          const productsWithRating = data.map(product => {
            const avgRating = product.reviews?.length > 0
              ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
              : 0
            return { ...product, avgRating, reviewCount: product.reviews?.length || 0 }
          })

          // Sort Data (ทำใน JS เพื่อความยืดหยุ่น)
          const sortedProducts = [...productsWithRating].sort((a, b) => {
            switch (currentSort) {
              case 'price_asc': return a.price - b.price
              case 'price_desc': return b.price - a.price
              case 'name_asc': return a.name.localeCompare(b.name)
              case 'rating': return b.avgRating - a.avgRating
              default: return new Date(b.created_at) - new Date(a.created_at)
            }
          })
          setProducts(sortedProducts)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [currentCategory, currentMinPrice, currentMaxPrice, currentQuery, currentSort])

  // ✅ Sync ช่องค้นหากับ URL (เผื่อกด Back)
  useEffect(() => {
    setTempSearch(currentQuery)
  }, [currentQuery])

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage
    return products.slice(startIndex, startIndex + productsPerPage)
  }, [products, currentPage])
  const totalPages = Math.ceil(products.length / productsPerPage)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURL({ q: tempSearch || null }) // ส่งค่าเข้า URL เพื่อ Trigger การโหลด
  }

  // Filter State สำหรับ UI Input
  const [localPrice, setLocalPrice] = useState({ min: currentMinPrice, max: currentMaxPrice })

  const activeFiltersCount = [currentQuery, currentCategory, currentMinPrice, currentMaxPrice, currentSort !== 'newest'].filter(Boolean).length

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-agri-pastel text-agri-primary p-2 rounded-lg">
              <SlidersHorizontal size={28} />
            </span>
            สินค้าเกษตรทั้งหมด
          </h1>
          <p className="text-gray-500 mt-1">คัดสรรคุณภาพเพื่อเกษตรกรไทย</p>
        </div>
        <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 font-medium">
          <Filter size={18} /> ตัวกรองสินค้า ({activeFiltersCount})
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className={`lg:w-1/4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-agri-primary" /> ตัวกรอง
              </h2>
              {activeFiltersCount > 0 && (
                <button onClick={() => { 
                    setTempSearch(''); setLocalPrice({min:'',max:''}); 
                    router.push(pathname); 
                }} className="text-xs text-red-500 hover:underline font-medium flex items-center gap-1">
                  <X size={12} /> ล้างค่า
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาชื่อสินค้า</label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  placeholder="เช่น ปุ๋ย, โดรน..."
                  className="flex-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-accent/50 transition-all text-sm"
                />
                <button type="submit" className="px-3 bg-agri-primary text-white rounded-lg hover:bg-agri-hover transition-colors">
                  <Search size={18} />
                </button>
              </form>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select value={currentCategory} onChange={(e) => { setCurrentPage(1); updateURL({ category: e.target.value || null }); }} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-accent/50 text-sm">
                <option value="">ทุกหมวดหมู่</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงราคา (บาท)</label>
              <div className="grid grid-cols-2 gap-2 items-center">
                <input type="number" placeholder="ต่ำสุด" value={localPrice.min} onChange={(e) => setLocalPrice(prev => ({ ...prev, min: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-accent/50 text-sm" min="0" />
                <input type="number" placeholder="สูงสุด" value={localPrice.max} onChange={(e) => setLocalPrice(prev => ({ ...prev, max: e.target.value }))} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-accent/50 text-sm" min="0" />
              </div>
              <button onClick={() => { setCurrentPage(1); updateURL({ min_price: localPrice.min || null, max_price: localPrice.max || null }) }} className="mt-3 w-full py-2 bg-agri-pastel text-agri-primary font-semibold rounded-lg hover:bg-agri-primary hover:text-white transition-all text-sm border border-agri-primary/20">
                ยืนยันช่วงราคา
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ราคาแนะนำ</p>
              {[
                { label: '1 - 1,000 ฿', min: '1', max: '1000' },
                { label: '1,000 - 5,000 ฿', min: '1000', max: '5000' },
                { label: '5,000+ ฿', min: '5000', max: '' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setLocalPrice({ min: item.min, max: item.max }); setCurrentPage(1); updateURL({ min_price: item.min, max: item.max || null }); }}
                  className="block w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-agri-primary rounded transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          
          {/* ✅ ส่วนสินค้าแนะนำ (แสดงเสมอ แม้ Search ไม่เจอ) */}
          {recommendedProducts.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles size={24} className="text-yellow-500 fill-yellow-500" /> สินค้าแนะนำสำหรับคุณ
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {recommendedProducts.map((product) => (
                  <ProductCard key={`rec-${product.id}`} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Product List Header */}
          <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 ml-2">พบ <span className="font-bold text-agri-primary">{products.length}</span> รายการ {currentQuery && `"${currentQuery}"`}</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 hidden sm:block">เรียงตาม:</label>
              <select value={currentSort} onChange={(e) => { updateURL({ sort: e.target.value !== 'newest' ? e.target.value : null }); }} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-agri-accent/50">
                <option value="newest">มาใหม่ล่าสุด</option>
                <option value="price_asc">ราคา: ต่ำ - สูง</option>
                <option value="price_desc">ราคา: สูง - ต่ำ</option>
                <option value="rating">คะแนนรีวิว</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-white h-80 rounded-xl shadow-sm animate-pulse"></div>)}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <PackageX size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">ไม่พบสินค้า</h3>
              <p className="text-gray-500">ลองปรับตัวกรองหรือคำค้นหาดูใหม่นะครับ</p>
              <button onClick={() => { setTempSearch(''); updateURL({ q: null }); }} className="mt-4 px-4 py-2 bg-agri-primary text-white rounded-lg text-sm hover:bg-agri-hover">
                ดูสินค้าทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-12">
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600"><ChevronLeft size={20} /></button>
              <span className="px-4 py-2 font-medium text-gray-700">หน้า {currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600"><ChevronRight size={20} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StorefrontPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center"><Loader2 className="h-8 w-8 text-agri-primary animate-spin mx-auto" /></div>}>
      <StorefrontContent />
    </Suspense>
  )
}