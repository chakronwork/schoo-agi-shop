// src/middleware.js
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. เช็คว่า User Login หรือยัง
  const { data: { user } } = await supabase.auth.getUser()

  // 2. กฎการป้องกัน (Protection Rules)
  const url = request.nextUrl.clone()
  
  // กรณี: ยังไม่ได้ Login แต่พยายามเข้าหน้า Admin, Seller หรือ Profile
  if (!user && (
    url.pathname.startsWith('/admin') || 
    url.pathname.startsWith('/seller') ||
    url.pathname.startsWith('/profile')
  )) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // กรณี: Login แล้ว แต่พยายามเข้าหน้า Login/Register อีก
  if (user && (url.pathname === '/login' || url.pathname === '/register')) {
    // ให้เด้งไปหน้าแรก หรือ Dashboard ของเขาก็ได้
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. (Optional & Recommended) เช็ค Role แบบเข้มข้น
  // ตรงนี้อาจต้องยิง DB เพิ่มเพื่อดึง Role มาเช็คว่า admin จริงไหม
  // แต่เพื่อประสิทธิภาพ ส่วนใหญ่มักจะเช็คที่ Page Layout หรือปล่อยให้ RLS กันที่ Database อีกที
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}