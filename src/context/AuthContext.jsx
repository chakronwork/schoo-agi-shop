// src/context/AuthContext.jsx

'use client'

import { createContext, useState, useEffect, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'

// 1. Create the Context
const AuthContext = createContext()

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This function runs once when the component mounts.
    const checkUserSession = async () => {
      // Try to get the current session from Supabase
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkUserSession()

    // This is the magic! Supabase auth listener.
    // It runs whenever the user logs in, logs out, or the session changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup function: Unsubscribe from the listener when the component unmounts.
    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase]) // The effect depends on the supabase client instance.

  // 3. Define the value to be passed to consuming components
  const value = {
    user,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 4. Create a custom hook for easy consumption
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}