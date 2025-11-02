// src/app/api/seller/products/route.js
import { NextResponse } from 'next/server'
// เราจะใช้ createServerClient โดยตรงที่นี่ แต่ต้องปรับวิธีเรียกใช้
import { createServerClient } from '@supabase/ssr'

export async function POST(request) {
  const response = NextResponse.next()
  
  // สร้าง Supabase client ที่ออกแบบมาสำหรับ API Routes/Middleware
  // โดยส่ง request เข้าไปจัดการเรื่อง cookie โดยตรง
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // 1. Check for authenticated user (โค้ดส่วนนี้เหมือนเดิม แต่ client ฉลาดขึ้นแล้ว)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if the user is a seller and get their store_id
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)
      .single()
    
    if (storeError || !store) {
      return NextResponse.json({ message: 'You are not a registered seller.' }, { status: 403 })
    }
    if (store.status !== 'approved') {
      return NextResponse.json({ message: `Your seller application is currently ${store.status}.` }, { status: 403 })
    }

    const storeId = store.id

    // 3. Parse FormData
    const formData = await request.formData()
    const name = formData.get('name')
    const description = formData.get('description')
    const price = formData.get('price')
    // เราจะเพิ่ม category_id เข้ามาด้วย เพราะมันจำเป็น
    const category_id = formData.get('category_id') // สมมติว่าส่งมาจาก Frontend
    const imageFile = formData.get('image')

    // 4. Validation
    if (!name || !description || !price || !imageFile || !category_id) {
      return NextResponse.json({ message: 'Missing required fields (name, description, price, image, category_id).' }, { status: 400 })
    }
    
    // 5. Upload image to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile)

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      throw new Error('Failed to upload image.')
    }

    // 6. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    // 7. Insert product data
    const { data: newProduct, error: productInsertError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price: parseFloat(price),
        store_id: storeId,
        category_id: parseInt(category_id, 10), // แปลงเป็น integer
      })
      .select()
      .single()

    if (productInsertError) {
      console.error('Product Insert Error:', productInsertError)
      await supabase.storage.from('product-images').remove([fileName])
      throw new Error('Failed to save product data.')
    }
    
    // 8. Insert image metadata
    const { error: imageInsertError } = await supabase
      .from('product_images')
      .insert({
        product_id: newProduct.id,
        image_url: publicUrl,
        file_size: imageFile.size,
        file_type: imageFile.type,
      })
        
    if (imageInsertError) {
      console.error('Image Meta Insert Error:', imageInsertError)
      throw new Error('Failed to save product image metadata.')
    }

    return NextResponse.json({ message: 'Product created successfully', product: newProduct })

  } catch (error) {
    console.error('Create Product Error:', error)
    return NextResponse.json({ message: error.message || 'An unexpected error occurred.' }, { status: 500 })
  }
}