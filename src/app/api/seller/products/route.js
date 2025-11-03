import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Maximum price allowed by database (numeric(10,2) = 10^8 - 0.01)
const MAX_PRICE = 99999999.99

export async function POST(request) {
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
    // Step 1: Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('API Auth Error:', authError)
      return NextResponse.json({ message: 'Unauthorized: No active session.' }, { status: 401 })
    }

    // Step 2: Authorize the user
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, status')
      .eq('user_id', user.id)
      .single()
    
    if (storeError) {
        if (storeError.code === 'PGRST116') {
            return NextResponse.json({ message: 'Forbidden: You are not a registered seller.' }, { status: 403 })
        }
        console.error('Error fetching store for user:', user.id, storeError)
        throw storeError
    }

    if (store.status !== 'approved') {
      return NextResponse.json({ message: `Forbidden: Your seller application status is '${store.status}'. It must be 'approved'.` }, { status: 403 })
    }

    const storeId = store.id

    // Step 3: Process and Validate Input Data
    const formData = await request.formData()
    const name = formData.get('name')?.toString().trim()
    const description = formData.get('description')?.toString().trim()
    const priceString = formData.get('price')
    const category_id = formData.get('category_id')
    const imageFile = formData.get('image')

    // Basic validation
    if (!name || !description || !priceString || !category_id || !imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'Bad Request: Missing or empty required fields (name, description, price, category_id, image).' }, { status: 400 })
    }

    // Parse and validate price
    const price = parseFloat(priceString)
    if (isNaN(price)) {
      return NextResponse.json({ message: 'Bad Request: Price must be a valid number.' }, { status: 400 })
    }
    if (price < 0) {
      return NextResponse.json({ message: 'Bad Request: Price cannot be negative.' }, { status: 400 })
    }
    if (price > MAX_PRICE) {
      return NextResponse.json({ message: `Bad Request: Price cannot exceed ${MAX_PRICE.toLocaleString()}.` }, { status: 400 })
    }
    // Check for reasonable decimal places (2 decimal places max)
    if (!/^\d+(\.\d{1,2})?$/.test(priceString)) {
      return NextResponse.json({ message: 'Bad Request: Price can have at most 2 decimal places.' }, { status: 400 })
    }

    // Parse and validate category_id
    const categoryId = parseInt(category_id, 10)
    if (isNaN(categoryId)) {
      return NextResponse.json({ message: 'Bad Request: category_id must be a valid number.' }, { status: 400 })
    }

    // Validate category exists (FIXED: Use proper query)
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single()

    if (categoryError || !categoryData) {
      console.error('Category validation error:', categoryError)
      return NextResponse.json({ message: 'Bad Request: Invalid category_id. The selected category does not exist.' }, { status: 400 })
    }

    // Step 4: Upload image
    const fileExtension = imageFile.name.split('.').pop()
    const sanitizedFileName = `${storeId}/${Date.now()}.${fileExtension}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(sanitizedFileName, imageFile)

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError)
      throw new Error('Internal Server Error: Failed to upload image.')
    }

    // Step 5: Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(sanitizedFileName)

    // Step 6: Create product using RPC
    const { error: rpcError } = await supabase.rpc('create_product_and_image', {
        p_name: name,
        p_description: description,
        p_price: price,
        p_store_id: storeId,
        p_category_id: categoryId,
        p_image_url: publicUrl,
        p_file_size: imageFile.size,
        p_file_type: imageFile.type
    })

    if (rpcError) {
        console.error('RPC create_product_and_image Error:', rpcError);
        // Clean up orphaned file
        await supabase.storage.from('product-images').remove([sanitizedFileName])
        
        // Provide more specific error messages
        if (rpcError.code === '22003') {
          return NextResponse.json({ message: 'Bad Request: Price value is too large for the database.' }, { status: 400 })
        }
        if (rpcError.code === '23503') {
          return NextResponse.json({ message: 'Bad Request: Invalid reference data (category or store).' }, { status: 400 })
        }
        
        throw new Error('Internal Server Error: Failed to save product data. The database operation failed.');
    }

    // Step 7: Success
    return NextResponse.json({ message: 'Product created successfully' }, { status: 201 })

  } catch (error) {
    console.error('Unhandled Create Product Error:', error.message)
    return NextResponse.json({ message: error.message || 'An unexpected error occurred.' }, { status: 500 })
  }
}