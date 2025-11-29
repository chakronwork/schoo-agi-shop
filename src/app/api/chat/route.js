// src/app/api/chat/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message, history } = await req.json();

    // ✅ จุดที่แก้: เพิ่ม await หน้า createClient() ครับ
    const supabase = await createClient(); 
    
    // 1. ดึงข้อมูลสินค้า (ตอนนี้ supabase เป็น object ที่ถูกต้องแล้ว .from() จะทำงานได้)
    const { data: products } = await supabase
      .from('products')
      .select('name, price, description, stock_quantity')
      .eq('status', 'available')
      .limit(20);

    // 2. สร้าง System Prompt
    const productContext = products?.map(p => 
      `- ${p.name}: ราคา ${p.price} บาท (เหลือ ${p.stock_quantity} ชิ้น) รายละเอียด: ${p.description}`
    ).join('\n') || "ไม่พบข้อมูลสินค้า";

    const systemInstruction = `
      คุณคือ "Dopa-Bot" ผู้ช่วย AI ของร้าน Dopa-Tech Marketplace
      หน้าที่ของคุณคือ: แนะนำสินค้าการเกษตร และตอบคำถามลูกค้าด้วยภาษาที่เป็นกันเอง สุภาพ และช่วยเหลือ
      
      นี่คือรายการสินค้าที่มีจำหน่ายในร้านตอนนี้:
      ${productContext}

      กฎเหล็ก:
      1. ตอบเฉพาะเรื่องการเกษตรและสินค้าในร้าน
      2. ถ้าลูกค้าถามถึงสินค้าที่ไม่มีในรายการ ให้แนะนำสินค้าที่ใกล้เคียงที่สุดแทน
      3. พยายามปิดการขาย หรือชวนให้ลูกค้าดูรายละเอียดสินค้าเพิ่ม
      4. ตอบสั้นกระชับ ไม่เยิ่นเย้อ
    `;

    // 3. เรียกใช้ Gemini Model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-lite-latest",
        systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: history || [], 
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "ขออภัย ระบบขัดข้องชั่วคราว" }, { status: 500 });
  }
}