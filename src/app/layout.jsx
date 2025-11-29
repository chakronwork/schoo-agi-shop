// src/app/layout.jsx

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext' // 1. Import AuthProvider
import Navbar from '@/components/common/Navbar' 
import { CartProvider } from '@/context/CartContext'
import ChatBot from '@/components/common/ChatBot'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI-Shop Electronics',
  description: 'A platform for buying and selling agricultural tech.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* 2. Wrap the children with AuthProvider */}
          <CartProvider>
          <Navbar /> {/* 3. Include the Navbar */}
          <main>{children}</main> {/* Wrap children in a main tag */}
          <ChatBot />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}