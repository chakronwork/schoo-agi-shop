// src/app/page.jsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
        ยินดีต้อนรับ สู่ Agri-Tech Marketplace
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        ครบ จบ เรื่องเครื่องมือการเกษตรในเว็บเดียว
      </p>
      <div className="mt-8">
        <Link 
          href="/storefront"
          className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Explore Products
        </Link>
      </div>
    </div>
  )
}