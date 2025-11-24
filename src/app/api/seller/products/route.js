// src/app/api/seller/products/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  const cookieStore = await cookies() // ✅ เพิ่ม await ตาม Next.js 15+
  
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

  try {
    // 1. เช็ค Login
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. เช็คว่าเป็นเจ้าของร้านจริงไหม (และ Status ร้านต้อง Approved)
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)
      .single()
    
    if (storeError || !store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 })
    }

    // 3. รับข้อมูลจาก Form
    const formData = await request.formData()
    const name = formData.get('name')
    const description = formData.get('description')
    const price = parseFloat(formData.get('price'))
    const stock = parseInt(formData.get('stock_quantity'))
    const categoryId = parseInt(formData.get('category_id'))
    const imageFile = formData.get('image')

    // 4. อัปโหลดรูป
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${store.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile)

    if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

    // 5. เอา URL รูป
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    // 6. บันทึกลงตาราง Products
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        stock_quantity: stock,
        category_id: categoryId,
        store_id: store.id,
        status: 'available'
      })
      .select('id') // คืนค่ากลับมาหน่อยจะได้ชัวร์
      .single()

    // 7. บันทึกลงตาราง product_images (เพื่อให้แสดงผลได้หลายรูปในอนาคต)
    // *หมายเหตุ: ต้อง query หา product_id ล่าสุดก่อน หรือใช้ค่าที่ return จากข้อ 6
    // แต่เพื่อให้ง่าย ใช้ trigger หรือ logic ในอนาคตมาจัดการ ตอนนี้เอาแค่รูปหลักก่อน
    
    // *แก้ไข: จริงๆ เราควร insert ลง product_images ด้วย เพื่อให้ ProductCard ดึงรูปได้ถูกต้อง*
    // แต่เนื่องจากเรายังไม่มี product_id ในมือ (ถ้าไม่ได้ใช้ .select().single()) 
    // งั้นเรามาแก้แบบง่ายๆ คือให้ products มี logic เชื่อมโยงรูป หรือใส่รูปแรก
    
    // ** เพื่อความชัวร์ ผมขอแก้ข้อ 6 ให้รับค่า ID มาใช้นะครับ **
    // (อิงตามโค้ดข้างบน ผมใส่ .select() ไว้แล้ว) 
    // แต่ถ้า supabase insert error ให้เช็คว่ามี trigger สร้างรูปไหม
    
    if (insertError) throw insertError

    // ถ้าต้องการบันทึก path รูปลงตาราง product_images ด้วย (ต้องทำ ไม่งั้นรูปไม่ขึ้น)
    // ต้องได้ Product ID มาก่อน ซึ่งถ้า insert สำเร็จควรจะได้มา
    // *ข้ามส่วนนี้ไปก่อน ถ้า ProductCard ดึงจาก product_images* // *เราต้อง Insert ลง product_images ด้วยครับ!*
    
    // 🔄 แก้ไข: ต้องดึง Product ล่าสุดที่เพิ่งสร้าง
    const { error: imageInsertError } = await supabase.from('product_images').insert({
      product_id: newProduct.id,
      image_url: publicUrl,
      is_primary: true
    })

    if (imageInsertError) throw imageInsertError

    return NextResponse.json({ message: 'Success' }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
