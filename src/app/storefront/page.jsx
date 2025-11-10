// src/app/storefront/page.jsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductCard from '@/components/features/products/ProductCard'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function StorefrontPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter States from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || ''
  })
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Update URL when filters change
  const updateURL = useCallback((updates = {}) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    })

    const newUrl = `${pathname}?${current.toString()}`
    router.push(newUrl, { scroll: false })
  }, [pathname, router, searchParams])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      
      if (!error && data) {
        setCategories(data)
      }
    }
    fetchCategories()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        let query = supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            created_at,
            stores ( id, store_name ),
            categories ( id, name ),
            product_images ( image_url ),
            reviews ( rating )
          `)
          .eq('status', 'available')

        // Apply category filter
        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory)
        }

        // Apply price range filter
        if (priceRange.min) {
          query = query.gte('price', parseFloat(priceRange.min))
        }
        if (priceRange.max) {
          query = query.lte('price', parseFloat(priceRange.max))
        }

        // Apply search filter
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        }

        const { data, error: supabaseError } = await query

        if (supabaseError) throw supabaseError

        // Calculate average rating for each product
        const productsWithRating = data.map(product => {
          const avgRating = product.reviews.length > 0
            ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
            : 0
          return { ...product, avgRating, reviewCount: product.reviews.length }
        })

        // Apply sorting
        const sortedProducts = [...productsWithRating].sort((a, b) => {
          switch (sortBy) {
            case 'price_asc':
              return a.price - b.price
            case 'price_desc':
              return b.price - a.price
            case 'name_asc':
              return a.name.localeCompare(b.name)
            case 'rating':
              return b.avgRating - a.avgRating
            case 'newest':
            default:
              return new Date(b.created_at) - new Date(a.created_at)
          }
        })

        setProducts(sortedProducts)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchQuery, selectedCategory, priceRange, sortBy])

  // Pagination logic
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage
    return products.slice(startIndex, startIndex + productsPerPage)
  }, [products, currentPage])

  const totalPages = Math.ceil(products.length / productsPerPage)

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    updateURL({ q: searchQuery || null })
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
    updateURL({ category: categoryId || null })
  }

  const handlePriceFilter = () => {
    setCurrentPage(1)
    updateURL({
      min_price: priceRange.min || null,
      max_price: priceRange.max || null
    })
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    updateURL({ sort: newSort !== 'newest' ? newSort : null })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setPriceRange({ min: '', max: '' })
    setSortBy('newest')
    setCurrentPage(1)
    router.push(pathname)
  }

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    priceRange.min,
    priceRange.max,
    sortBy !== 'newest'
  ].filter(Boolean).length

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">All Products</h1>
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Products</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-1/4">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Clear all ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (THB)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
              <button
                onClick={handlePriceFilter}
                className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Apply Price Filter
              </button>
            </div>

            {/* Quick Price Filters */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Filters</p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setPriceRange({ min: '0', max: '1000' })
                    handlePriceFilter()
                  }}
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  Under ฿1,000
                </button>
                <button
                  onClick={() => {
                    setPriceRange({ min: '1000', max: '5000' })
                    handlePriceFilter()
                  }}
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  ฿1,000 - ฿5,000
                </button>
                <button
                  onClick={() => {
                    setPriceRange({ min: '5000', max: '10000' })
                    handlePriceFilter()
                  }}
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  ฿5,000 - ฿10,000
                </button>
                <button
                  onClick={() => {
                    setPriceRange({ min: '10000', max: '' })
                    handlePriceFilter()
                  }}
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
                >
                  Over ฿10,000
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:flex-1">
          {/* Sort and Results Count */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600">
              Showing {paginatedProducts.length} of {products.length} products
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {error ? (
            <div className="text-center py-10">
              <p className="text-red-600">Error: {error}</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No products found matching your filters.</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        page === currentPage
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-1">...</span>
                }
                return null
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}