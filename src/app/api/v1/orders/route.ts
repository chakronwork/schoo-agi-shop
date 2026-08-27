import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Schema สำหรับตรวจสอบข้อมูลที่ได้รับ
const orderSchema = z.object({
  payment_method: z.string(),
  phone: z.string(),
  shipping_address: z.string(),
  // user_id จะดึงจาก session ไม่ต้องรับจาก client เพื่อความปลอดภัย
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. ตรวจสอบ Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. รับและตรวจสอบข้อมูล
    const body = await request.json();
    const validation = orderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.message },
        { status: 400 }
      );
    }

    const { payment_method, phone, shipping_address } = validation.data;

    // 3. ดึงข้อมูล Cart ของผู้ใช้
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        products (
          id,
          name,
          price,
          stock,
          seller_id
        )
      `)
      .eq('user_id', user.id);

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // 4. คำนวณราคารวม และ ตรวจสอบ Stock
    let total_amount = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const product = item.products as any;
      if (!product) continue;

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Product ${product.name} is out of stock` },
          { status: 400 }
        );
      }

      total_amount += product.price * item.quantity;
      orderItemsData.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        seller_id: product.seller_id
      });
    }

    // 5. เริ่ม Transaction (สร้าง Order และ Order Items)
    // หมายเหตุ: Supabase JS Client ไม่มี transaction แบบ SQL โดยตรง 
    // เราจะใช้การเรียกแบบลำดับและตรวจสอบ error
    
    // 5.1 สร้าง Order หลัก
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: total_amount,
        payment_method: payment_method,
        phone: phone,
        shipping_address: shipping_address,
        status: 'pending' // หรือ 'awaiting_payment' แล้วแต่ logic
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    // 5.2 สร้าง Order Items
    const itemsToInsert = orderItemsData.map(item => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      seller_id: item.seller_id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Rollback: ลบ Order ที่สร้างไว้ถ้า insert items ไม่สำเร็จ
      await supabase.from('orders').delete().eq('id', newOrder.id);
      throw new Error('Failed to create order items');
    }

    // 5.3 ลด Stock และ ล้าง Cart
    // ลด Stock - ใช้วิธี update ทีละตัวเพื่อความปลอดภัย
    for (const item of orderItemsData) {
      // ดึง stock ปัจจุบัน
      const { data: productData } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();
      
      if (productData) {
        await supabase
          .from('products')
          .update({ stock: productData.stock - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // ล้าง Cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    // 6. ส่งผลลัพธ์กลับ
    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Place order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
