// src/app/api/payment/route.js
import { NextResponse } from 'next/server'
import Omise from 'omise'

const omise = Omise({
  publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
})

export async function POST(request) {
  try {
    const { amount, tokenId, sourceId } = await request.json()

    // สร้าง Charge (รายการเรียกเก็บเงิน)
    const charge = await omise.charges.create({
      amount: amount * 100, // หน่วยเป็นสตางค์ (บาท * 100)
      currency: 'thb',
      card: tokenId, // กรณีตัดบัตร
      source: sourceId, // กรณี QR Code / Internet Banking
      return_uri: 'https://agri-tech-marketplace-azure.vercel.app/checkout/complete', // (Optional) กรณีต้อง Redirect
    })

    return NextResponse.json({ charge })

  } catch (error) {
    console.error('Omise Error:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}