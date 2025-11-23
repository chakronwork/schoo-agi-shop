// src/app/page.jsx
'use client'

import Link from 'next/link'
import { ArrowRight, Sprout, Tractor,  ScanEye, ShieldCheck, Truck, Leaf, Droplets } from 'lucide-react'

export default function HomePage() {
  // จำลองหมวดหมู่ (ถ้า Database จริงมี ID ต่างจากนี้ ให้แก้เลข ID ใน Link นะครับ)
  const categories = [
    { id: 1, name: 'ปุ๋ยและเคมีภัณฑ์', icon: <Sprout size={32} />, color: 'bg-green-100 text-green-600' },
    { id: 2, name: 'โดรนการเกษตร', icon: <ScanEye size={32} />, color: 'bg-blue-100 text-blue-600' },
    { id: 3, name: 'เครื่องจักรกล', icon: <Tractor size={32} />, color: 'bg-orange-100 text-orange-600' },
    { id: 4, name: 'ระบบน้ำ & Smart Farm', icon: <Droplets size={32} />, color: 'bg-cyan-100 text-cyan-600' },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* 🌿 1. Hero Section */}
      <section className="relative bg-agri-primary overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white text-sm font-medium mb-6 border border-white/20 backdrop-blur-sm animate-fade-in-up">
            🌱 แพลตฟอร์มเพื่อเกษตรกรไทยยุคใหม่
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            ยกระดับการเกษตรด้วย <br/>
            <span className="text-agri-warning text-shadow-sm">เทคโนโลยีและนวัตกรรม</span>
          </h1>
          
          <p className="text-lg md:text-xl text-green-50 mb-10 max-w-2xl mx-auto font-light">
            แหล่งรวมอุปกรณ์การเกษตรอัจฉริยะ ครบ จบ ในที่เดียว พร้อมระบบซื้อขายที่ปลอดภัยและเชื่อถือได้
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/storefront"
              className="px-8 py-4 text-lg font-bold text-agri-primary bg-white rounded-xl hover:bg-gray-50 transition-transform hover:scale-105 shadow-xl"
            >
              ช้อปสินค้าเลย 🛒
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 text-lg font-bold text-white bg-agri-hover/50 border border-white/30 rounded-xl hover:bg-agri-hover transition-all backdrop-blur-sm"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>
        </div>
        
        {/* Wave Shape Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-background"></path>
          </svg>
        </div>
      </section>

      {/* 🛡️ 2. Features / Value Props */}
      <section className="py-12 -mt-8 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <ShieldCheck size={36} />, title: "สินค้าคุณภาพ", desc: "คัดสรรจากแบรนด์ชั้นนำ เชื่อถือได้ 100%" },
              { icon: <Truck size={36} />, title: "จัดส่งรวดเร็ว", desc: "ครอบคลุมพื้นที่เกษตรทั่วประเทศไทย" },
              { icon: <Leaf size={36} />, title: "เกษตรยั่งยืน", desc: "สนับสนุนเทคโนโลยีที่เป็นมิตรต่อสิ่งแวดล้อม" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="text-agri-primary mb-4 bg-agri-pastel p-4 rounded-full">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📦 3. Categories Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">หมวดหมู่สินค้า</h2>
            <p className="text-gray-500">เลือกดูสินค้าตามประเภทที่คุณสนใจ</p>
          </div>
          <Link href="/storefront" className="hidden md:flex items-center gap-2 text-agri-primary font-bold hover:underline">
            ดูทั้งหมด <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/storefront?category=${cat.id}`}
              className="group flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-agri-accent transition-all"
            >
              <div className={`p-4 rounded-full mb-4 transition-transform group-hover:scale-110 ${cat.color}`}>
                {cat.icon}
              </div>
              <span className="text-lg font-semibold text-gray-700 group-hover:text-agri-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
           <Link href="/storefront" className="inline-flex items-center gap-2 text-agri-primary font-bold">
            ดูสินค้าทั้งหมด <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* 📣 4. Call to Action */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-gradient-to-r from-agri-primary to-green-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern.svg')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              พร้อมยกระดับฟาร์มของคุณหรือยัง?
            </h2>
            <p className="text-lg text-green-50 mb-10 max-w-2xl mx-auto">
              เข้าร่วมกับเกษตรกรยุคใหม่ที่ไว้วางใจ Agri-Tech ในการพัฒนาผลผลิต
            </p>
            <Link 
              href="/register"
              className="inline-block px-10 py-4 text-lg font-bold text-agri-primary bg-white rounded-xl hover:bg-gray-50 shadow-lg transition-all hover:scale-105"
            >
              เปิดบัญชีฟรีทันที 🚀
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}