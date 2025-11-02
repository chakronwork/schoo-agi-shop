// src/app/layout.jsx

import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext' // 1. Import AuthProvider
import Navbar from '@/components/common/Navbar' 

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Agri-Tech Marketplace',
  description: 'A platform for buying and selling agricultural tech.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* 2. Wrap the children with AuthProvider */}
          <Navbar /> {/* 3. Include the Navbar */}
          <main>{children}</main> {/* Wrap children in a main tag */}
        </AuthProvider>
      </body>
    </html>
  )
}