// src/app/api/products/route.js
import { NextResponse } from 'next/server'
// เปลี่ยนจาก server client เป็น admin client (ถ้ามี admin client)
// หรือถ้าไม่มีให้ใช้ createServerClient ปกติ แต่ต้องจัดการเรื่อง Permission
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request) {
  // ใช้ supabaseAdmin เพื่อข้าม RLS ในการดึงข้อมูลมาแสดงผล API
  // ระวังการใช้งานจริงต้องมั่นใจว่าข้อมูลที่ส่งออกไปเป็น public ได้
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
        store_description
      `)
      .eq('status', 'available')
      // limit 1 รูปภาพต่อสินค้า เพื่อลดขนาด response
      .limit(1, { foreignTable: 'product_images' })

    if (error) {
      throw error 
    }

    return NextResponse.json({ products })

  } catch (error) {
    console.error('Error fetching products API:', error.message);
    return NextResponse.json({ message: 'Error fetching products', error: error.message }, { status: 500 })
  }
}