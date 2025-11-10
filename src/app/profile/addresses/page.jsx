// src/app/profile/addresses/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AddressBookPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    label: '',
    recipient_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'Thailand',
    is_default: false
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchAddresses()
    }
  }, [user, authLoading])

  const fetchAddresses = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setAddresses(data || [])
    } catch (err) {
      console.error('Error fetching addresses:', err)
      setError('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let result

      if (editingAddress) {
        // Update existing address
        result = await supabase
          .from('shipping_addresses')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddress.id)
          .eq('user_id', user.id)
      } else {
        // Create new address
        result = await supabase
          .from('shipping_addresses')
          .insert({
            ...formData,
            user_id: user.id
          })
      }

      if (result.error) throw result.error

      // If setting as default, update other addresses
      if (formData.is_default) {
        await supabase
          .from('shipping_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', editingAddress?.id || result.data?.[0]?.id)
      }

      setSuccess(editingAddress ? 'Address updated successfully!' : 'Address added successfully!')
      resetForm()
      fetchAddresses()
    } catch (err) {
      console.error('Error saving address:', err)
      setError('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return

    try {
      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user.id)

      if (error) throw error

      setSuccess('Address deleted successfully!')
      fetchAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
      setError('Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      // First, unset all defaults
      await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Then set the new default
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user.id)

      if (error) throw error

      setSuccess('Default address updated!')
      fetchAddresses()
    } catch (err) {
      console.error('Error setting default address:', err)
      setError('Failed to set default address')
    }
  }

  const openEditModal = (address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label || '',
      recipient_name: address.recipient_name || '',
      phone_number: address.phone_number || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state_province: address.state_province || '',
      postal_code: address.postal_code || '',
      country: address.country || 'Thailand',
      is_default: address.is_default || false
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setShowAddModal(false)
    setEditingAddress(null)
    setFormData({
      label: '',
      recipient_name: '',
      phone_number: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: 'Thailand',
      is_default: false
    })
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading addresses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Address Book</h1>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          <Link
            href="/profile"
            className="pb-4 px-1 border-b-2 border-transparent text-gray-600 hover:text-gray-800"
          >
            Profile Information
          </Link>
          <Link
            href="/profile/orders"
            className="pb-4 px-1 border-b-2 border-transparent text-gray-600 hover:text-gray-800"
          >
            Order History
          </Link>
          <button className="pb-4 px-1 border-b-2 border-indigo-600 text-indigo-600 font-medium">
            Address Book
          </button>
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Add Address Button */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          + Add New Address
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="mt-4 text-gray-600">No addresses saved yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white border rounded-lg p-4 ${
                address.is_default ? 'border-indigo-600' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {address.label || 'Address'}
                  </h3>
                  {address.is_default && (
                    <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(address)}
                    className="text-gray-600 hover:text-indigo-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">{address.recipient_name}</p>
                <p>{address.phone_number}</p>
                <p>{address.address_line1}</p>
                {address.address_line2 && <p>{address.address_line2}</p>}
                <p>
                  {address.city}, {address.state_province} {address.postal_code}
                </p>
                <p>{address.country}</p>
              </div>

              {!address.is_default && (
                <button
                  onClick={() => handleSetDefault(address.id)}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Set as Default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Label (e.g., Home, Work)
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Home"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.address_line1}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Street address, P.O. box, company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Apartment, suite, unit, building, floor, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state_province}
                    onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Thailand">Thailand</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {saving ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}