// src/context/CartContext.jsx
'use client'

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback 
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'

// 1. สร้าง Context
const CartContext = createContext()

// 2. สร้าง Provider Component
export function CartProvider({ children }) {
  const supabase = createClient()
  const { user } = useAuth()
  
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // สร้างฟังก์ชันสำหรับดึงข้อมูลตะกร้า
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // ดึงข้อมูล cart_items พร้อมกับข้อมูล product และ product_images ที่เกี่ยวข้อง
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id, 
          quantity,
          products (
            id,
            name,
            price,
            product_images ( image_url )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // จัดการข้อมูลรูปภาพ (ดึงเฉพาะ image_url แรก)
      const formattedData = data.map(item => ({
        ...item,
        products: {
          ...item.products,
          imageUrl: item.products.product_images?.[0]?.image_url || '/placeholder.svg'
        }
      }))
      
      setCartItems(formattedData)
    } catch (err) {
      console.error('Error fetching cart:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  // Effect ที่จะทำงานเมื่อ user (login/logout) เปลี่ยนแปลง
  useEffect(() => {
    fetchCart()
  }, [user, fetchCart])

  // --- ฟังก์ชันสำหรับจัดการตะกร้า ---

  // ฟังก์ชันเพิ่มสินค้า
  const addItem = async (productId, quantity = 1) => {
    if (!user) {
      alert('Please log in to add items to your cart.')
      return
    }

    // ตรวจสอบว่ามีสินค้านี้ในตะกร้า (state) หรือยัง
    // นี่คือ Logic ที่เราใช้ เพราะ Schema ของคุณเฟิร์สไม่ได้บังคับ UNIQUE
    const existingItem = cartItems.find(item => item.products.id === productId)

    try {
      if (existingItem) {
        // ถ้ามีอยู่แล้ว -> อัปเดต Quantity
        const newQuantity = existingItem.quantity + quantity
        await updateItemQuantity(existingItem.id, newQuantity)
      } else {
        // ถ้ายังไม่มี -> เพิ่มแถวใหม่
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: quantity
          })
        if (error) throw error
      }
      // ดึงข้อมูลตะกร้าใหม่หลังจากการเปลี่ยนแปลง
      await fetchCart()
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err.message)
    }
  }

  // ฟังก์ชันอัปเดตจำนวนสินค้า
  const updateItemQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      // ถ้าจำนวนเป็น 0 หรือน้อยกว่า ให้ลบออก
      await removeItem(cartItemId)
      return
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId)
      
      if (error) throw error
      await fetchCart()
    } catch (err) {
      console.error('Error updating quantity:', err)
      setError(err.message)
    }
  }

  // ฟังก์ชันลบสินค้า
  const removeItem = async (cartItemId) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
      
      if (error) throw error
      await fetchCart()
    } catch (err) {
      console.error('Error removing item:', err)
      setError(err.message)
    }
  }

  // --- ข้อมูลที่คำนวณได้ ---
  
  // คำนวณจำนวนสินค้ารวม
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  // คำนวณราคารวม
  const totalAmount = cartItems.reduce((total, item) => {
    return total + (item.products.price * item.quantity)
  }, 0)

  // 3. ส่ง Value ที่จำเป็น
  const value = {
    cartItems,
    loading,
    error,
    itemCount,
    totalAmount,
    addItem,
    updateItemQuantity,
    removeItem,
    fetchCart, // ส่ง fetchCart ไปด้วยเผื่อจำเป็น
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// 4. สร้าง Custom Hook
export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}