// src/app/api/seller/products/route.js

import { NextResponse } from 'next/server'
// เราจะใช้ createServerClient โดยตรงที่นี่ แต่ต้องปรับวิธีเรียกใช้
import { createServerClient } from '@supabase/ssr'

export async function POST(request) {
  // สร้าง Supabase client ที่ออกแบบมาสำหรับ API Routes/Middleware
  // โดยส่ง request เข้าไปจัดการเรื่อง cookie โดยตรง
  // นี่คือวิธีที่ถูกต้องสำหรับ API Routes
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // 1. Check for authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('API Auth Error:', authError)
      return NextResponse.json({ message: 'Unauthorized: No active session.' }, { status: 401 })
    }

    // 2. Check if the user is a seller and get their store_id
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)
      .single() // .single() expects exactly one row, will error if 0 or more than 1 are found.
    
    // Detailed error logging for debugging
    if (storeError) {
        console.error('Error fetching store for user:', user.id, storeError)
        // If the error is "PGRST116", it means no rows were found.
        if (storeError.code === 'PGRST116') {
            return NextResponse.json({ message: 'Forbidden: You are not a registered seller.' }, { status: 403 })
        }
        throw storeError // Throw other unexpected database errors
    }

    if (!store) {
      // This case might be redundant due to .single() but it's a good safeguard.
      return NextResponse.json({ message: 'Forbidden: Seller profile not found.' }, { status: 403 })
    }

    if (store.status !== 'approved') {
      return NextResponse.json({ message: `Forbidden: Your seller application status is '${store.status}'. It must be 'approved'.` }, { status: 403 })
    }

    const storeId = store.id

    // 3. Parse FormData
    const formData = await request.formData()
    const name = formData.get('name')
    const description = formData.get('description')
    const price = formData.get('price')
    const category_id = formData.get('category_id')
    const imageFile = formData.get('image')

    // 4. Validation
    if (!name || !description || !price || !imageFile || !category_id) {
      return NextResponse.json({ message: 'Bad Request: Missing required fields (name, description, price, image, category_id).' }, { status: 400 })
    }
    if (imageFile.size === 0) {
        return NextResponse.json({ message: 'Bad Request: Image file cannot be empty.' }, { status: 400 })
    }

    // 5. Upload image to Supabase Storage
    // Use a structured path like: /public/{store_id}/{file_name}
    // บรรทัดใหม่ที่แก้ไขแล้ว
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}.${fileExtension}`;    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile)

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      throw new Error('Internal Server Error: Failed to upload image.')
    }

    // 6. Get the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    // 7. Insert product data and image metadata in a transaction
    const { data: newProduct, error: rpcError } = await supabase.rpc('create_product_and_image', {
        p_name: name,
        p_description: description,
        p_price: parseFloat(price),
        p_store_id: storeId,
        p_category_id: parseInt(category_id, 10),
        p_image_url: publicUrl,
        p_file_size: imageFile.size,
        p_file_type: imageFile.type
    })

    if (rpcError) {
        console.error('RPC create_product_and_image Error:', rpcError);
        // If the transaction fails, we should try to clean up the uploaded file.
        await supabase.storage.from('product-images').remove([fileName])
        throw new Error('Internal Server Error: Failed to save product data.');
    }

    return NextResponse.json({ message: 'Product created successfully', product: newProduct }, { status: 201 })

  } catch (error) {
    console.error('Unhandled Create Product Error:', error)
    return NextResponse.json({ message: error.message || 'An unexpected error occurred.' }, { status: 500 })
  }
}