// src/app/api/products/route.js
import { NextResponse } from 'next/server'
// เปลี่ยนจาก server client เป็น admin client
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request) {
  // ไม่ต้องใช้ createClient() แล้ว
  const supabase = supabaseAdmin
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        stores ( id, store_name ),
        product_images ( image_url )
      `)
      .eq('status', 'available')
      .limit(1, { foreignTable: 'product_images' })

    if (error) {
      // โยน error ที่มาจาก Supabase โดยตรงจะเห็นรายละเอียดดีกว่า
      throw error 
    }

    return NextResponse.json({ products })

  } catch (error) {
    // Log error ที่มีรายละเอียดมากขึ้น
    console.error('Error fetching products:', { message: error.message, details: error.details });
    return NextResponse.json({ message: 'Error fetching products', error: { message: error.message } }, { status: 500 })
  }
}