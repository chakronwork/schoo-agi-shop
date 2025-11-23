'use client'

import { createContext, useState, useEffect, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // ✅ แก้ไข: ใส่ใน useState เพื่อให้สร้างแค่ครั้งเดียว ไม่สร้างใหม่ทุกครั้งที่ render
  const [supabase] = useState(() => createClient())
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUserSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // เช็คก่อน set เพื่อลดการ render ซ้ำ
        setUser(current => {
            if (current?.id === session?.user?.id) return current
            return session?.user ?? null
        })
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const value = {
    user,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}