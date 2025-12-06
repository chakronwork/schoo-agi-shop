// src/app/profile/orders/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

const formatPrice = (price) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
  const texts = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return texts[status] || status
}

export default function OrderHistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchOrders()
    }
  }, [user, authLoading, filterStatus])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          shipping_address,
          payment_method,
          created_at,
          order_items (
            id,
            quantity,
            price_at_purchase,
            products (
              id,
              name,
              product_images ( image_url ),
              stores (
                store_name
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Failed to load order history')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <Link
            href="/profile"
            className="pb-4 px-1 border-b-2 border-transparent text-gray-600 hover:text-gray-800"
          >
            Profile Information
          </Link>
          <button className="pb-4 px-1 border-b-2 border-indigo-600 text-indigo-600 font-medium">
            Order History
          </button>
          <Link
            href="/profile/addresses"
            className="pb-4 px-1 border-b-2 border-transparent text-gray-600 hover:text-gray-800"
          >
            Address Book
          </Link>
        </nav>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`p-3 rounded-lg border text-center transition-colors ${
            filterStatus === 'all' 
              ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold">{orderStats.total}</p>
          <p className="text-sm">All Orders</p>
        </button>
        
        {Object.entries(orderStats).filter(([key]) => key !== 'total').map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-3 rounded-lg border text-center transition-colors ${
              filterStatus === status 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="mt-4 text-gray-600">
            {filterStatus === 'all' 
              ? "You haven't placed any orders yet." 
              : `No ${filterStatus} orders found.`}
          </p>
          <Link href="/storefront" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Order Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-2 md:mb-0">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      {/* ✅ แก้ไขจุดที่ Error: เติม .toString() */}
                      <p className="font-medium">#{order.id.toString().slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-medium text-indigo-600">{formatPrice(order.total_amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <Link href={`/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.order_items.slice(0, 3).map((item) => {
                    const imageUrl = item.products?.product_images?.[0]?.image_url || '/placeholder.svg'
                    return (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.products?.name || 'Product'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.products?.name || 'Product'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.products?.stores?.store_name || 'Unknown Store'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {order.order_items.length > 3 && (
                    <div className="flex items-center justify-center text-gray-500">
                      <p className="text-sm">+{order.order_items.length - 3} more items</p>
                    </div>
                  )}
                </div>

                {/* Order Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
                  <Link href={`/orders/${order.id}`} className="flex-1 text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    Order Details
                  </Link>
                  {/* ปุ่มอื่นๆ ซ่อนไว้ก่อนเพื่อความเรียบง่ายในการแก้บั๊ก */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}