import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // const next = searchParams.get('next') ?? '/' // ❌ อันเดิม: ไม่ใช้แล้วเพราะเราจะกำหนดเอง

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // 1. แลก Session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      // 2. ✅ เช็ค Role ทันทีหลังจาก Login ผ่าน Google สำเร็จ
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      const role = profile?.role || 'buyer' // ถ้าหาไม่เจอให้เป็น buyer

      // 3. กำหนดปลายทางตาม Role
      let targetUrl = '/storefront'
      if (role === 'admin') targetUrl = '/admin/dashboard'
      if (role === 'seller') targetUrl = '/seller/dashboard'

      return NextResponse.redirect(`${origin}${targetUrl}`)
    }
  }

  // ถ้า Error ส่งกลับไปหน้า Login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}