// src/app/auth/callback/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // const next = searchParams.get('next') ?? '/' // ❌ ไม่ใช้ค่า next เดิมแล้ว เพราะเราจะกำหนดเองตาม Role

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // 1. แลกเปลี่ยน Code เป็น Session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      // 2. ✅ เช็ค Role จากตาราง user_profiles ทันที
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle() // ใช้ maybeSingle เพื่อกัน Error กรณี User ใหม่ยังไม่มี Profile

      const role = profile?.role || 'buyer' // ถ้าหาไม่เจอ ให้ถือว่าเป็น buyer (ลูกค้าทั่วไป)

      // 3. ✅ กำหนดเส้นทาง (Target URL) ตาม Role
      let targetUrl = '/storefront' // Default
      
      if (role === 'admin') {
        targetUrl = '/admin/dashboard'
      } else if (role === 'seller') {
        targetUrl = '/seller/dashboard'
      }

      // 4. Redirect ไปยังหน้าที่ถูกต้อง (รองรับทั้ง Local และ Production)
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${targetUrl}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${targetUrl}`)
      } else {
        return NextResponse.redirect(`${origin}${targetUrl}`)
      }
    }
  }

  // กรณี Error ให้ส่งกลับไปหน้า Login พร้อม Error Code
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}