// src/app/api/products/[id]/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request, { params }) {
  const { id } = params // The [id] from the URL
  const supabase = supabaseAdmin

  if (!id) {
    return NextResponse.json({ message: 'Product ID is required' }, { status: 400 })
  }

  try {
    // This is a more complex query to fetch everything related to a single product
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        stock_quantity,
        status,
        stores ( id, store_name ),
        categories ( id, name ),
        product_images ( id, image_url ),
        reviews (
          id,
          rating,
          comment,
          created_at,
          user_profiles ( full_name )
        )
      `)
      .eq('id', id)
      .single() // We expect only one product

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: `Product with id ${id} not found` }, { status: 404 })
      }
      throw error
    }

    if (!product) {
      return NextResponse.json({ message: `Product with id ${id} not found` }, { status: 404 })
    }

    return NextResponse.json({ product })

  } catch (error) {
    console.error(`Error fetching product ${id}:`, error)
    return NextResponse.json({ message: 'Error fetching product', error: { message: error.message } }, { status: 500 })
  }
}