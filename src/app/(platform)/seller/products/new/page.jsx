// src/app/(platform)/seller/products/new/page.jsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function NewProductPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('') // State for Category ID
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])


  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('File is too large. Maximum size is 2MB.')
        return
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, and WEBP are allowed.')
        return
      }
      setError(null)
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imageFile) {
      setError('Product image is required.')
      return
    }
    setLoading(true)
    setError(null)
    
    // ==========================================================
    // FIXED: ประกาศ formData ก่อนใช้งาน
    // ==========================================================
    const formData = new FormData()
    formData.append('name', productName)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('category_id', categoryId)
    formData.append('image', imageFile)

    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create product')
      }

      alert('Product created successfully!')
      router.push('/seller/dashboard') // Redirect after success

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="text-center py-10">Loading authentication status...</div>

  // Basic style for input fields
  const inputClass = "w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">Product Name</label>
          <input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} required className={inputClass} />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" required className={inputClass}></textarea>
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (THB)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" className={inputClass} />
        </div>
        
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category ID</label>
          <input 
            type="number" 
            id="category" 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)} 
            required 
            placeholder="Enter Category ID (e.g., 1)"
            className={inputClass}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Image</label>
          <div className="mt-1 flex items-center space-x-4">
            <div className="w-24 h-24 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-gray-500">Preview</span>
              )}
            </div>
            <input type="file" onChange={handleImageChange} accept="image/jpeg,image/png,image/webp" required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <div>
          <button type="submit" disabled={loading} className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}