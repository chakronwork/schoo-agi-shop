// src/app/api/seller/products/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
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

  try {
    // 1. เช็ค Login
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. เช็คว่าเป็นเจ้าของร้านจริงไหม
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

    if (!imageFile) {
        return NextResponse.json({ message: 'Image is required' }, { status: 400 })
    }

    // 4. อัปโหลดรูปภาพ
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${store.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile)

    if (uploadError) throw new Error('Upload failed: ' + uploadError.message)

    // 5. เอา URL รูป (ใช้ getPublicUrl เสมอ)
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    // 6. บันทึกลงตาราง Products และรับ ID กลับมา
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
      .select('id')
      .single()

    if (insertError) throw insertError

    // 7. ✅ สำคัญ: บันทึกลงตาราง product_images ทันที
    const { error: imageInsertError } = await supabase
      .from('product_images')
      .insert({
        product_id: newProduct.id,
        image_url: publicUrl,
        is_primary: true
      })

    if (imageInsertError) {
        // (Optional) ถ้าใส่รูปไม่เข้า อาจจะลบ product ทิ้งเพื่อไม่ให้ data ขยะค้าง
        // await supabase.from('products').delete().eq('id', newProduct.id)
        throw imageInsertError
    }

    return NextResponse.json({ message: 'Success', productId: newProduct.id }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}