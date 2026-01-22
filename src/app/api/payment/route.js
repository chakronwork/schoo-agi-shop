// src/app/api/payment/route.js
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { amount, method } = await request.json()

    // จำลองว่ากำลังคิด (หน่วงเวลา 1 วินาที) ให้ดูเหมือนโหลดจริง
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (method === 'promptpay') {
      // ส่งข้อมูลหลอกๆ กลับไป (Mock Data)
      // พี่ใช้ api.qrserver.com สร้างรูป QR Code ให้เราฟรีๆ ตามยอดเงิน
      return NextResponse.json({
        charge: {
          id: 'chrg_mock_123456', // รหัสออเดอร์มั่วๆ
          source: {
            scannable_code: {
              image: {
                // สร้างรูป QR Code ที่มีข้อความว่า "จ่ายเงิน xxx บาท"
                download_uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Payment-Mockup-${amount}-Baht`
              }
            }
          }
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json({ message: 'Mock Error' }, { status: 500 })
  }
}