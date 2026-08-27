# Agri-Tech Marketplace

> Modern Agricultural Equipment E-Commerce Platform
> แพลตฟอร์ม E-Commerce สำหรับซื้อ-ขายอุปกรณ์การเกษตรสมัยใหม่

**Developer:** Chakron Yuraket (ชาคร ยุระเกตุ)  
**Email:** chakronwork@gmail.com  
**GitHub:** [chakronwork](https://github.com/chakronwork)  
**License:** MIT License - All Rights Reserved

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

---

## 📋 Table of Contents | สารบัญ

- [Overview | ภาพรวมโครงการ](#overview--ภาพรวมโครงการ)
- [System Architecture | สถาปัตยกรรมระบบ](#system-architecture--สถาปัตยกรรมระบบ)
- [Tech Stack | เทคโนโลยีที่ใช้](#tech-stack--เทคโนโลยีที่ใช้)
- [Key Features | ฟีเจอร์หลัก](#key-features--ฟีเจอร์หลัก)
- [Security | ความปลอดภัย](#security--ความปลอดภัย)
- [Installation & Running | การติดตั้งและรันโปรเจกต์](#installation--running--การติดตั้งและรันโปรเจกต์)
- [Docker Deployment | การใช้งาน Docker](#docker-deployment--การใช้งาน-docker)
- [Folder Structure | โครงสร้างโฟลเดอร์](#folder-structure--โครงสร้างโฟลเดอร์)
- [Architecture Decisions | การตัดสินใจทางสถาปัตยกรรม](#architecture-decisions--การตัดสินใจทางสถาปัตยกรรม)
- [Roadmap](#roadmap)
- [Contact | ติดต่อผู้พัฒนา](#contact--ติดต่อผู้พัฒนา)
- [License | ใบอนุญาต](#license--ใบอนุญาต)

---

## 🌾 Overview | ภาพรวมโครงการ

**English:**  
Agri-Tech Marketplace is an E-Commerce platform designed as a marketplace for buying and selling modern agricultural equipment such as agricultural drones, IoT sensors, and high-tech tools. This project is developed as a portfolio piece to demonstrate advanced full-stack development skills, modern architecture patterns, and enterprise-level security practices.

**ภาษาไทย:**  
Agri-Tech Marketplace คือแพลตฟอร์ม E-Commerce ที่ถูกสร้างขึ้นเพื่อเป็นตลาดกลางสำหรับซื้อ-ขายอุปกรณ์การเกษตรสมัยใหม่ เช่น โดรนเพื่อการเกษตร, เซ็นเซอร์ IoT, และเครื่องมือไฮเทคต่างๆ โครงการนี้ถูกพัฒนาขึ้นเพื่อใช้เป็นพอร์ตโฟลิโอในการสมัครงาน โดยมุ่งเน้นการแสดงทักษะการพัฒนาแบบ Full-Stack ขั้นสูง รูปแบบสถาปัตยกรรมสมัยใหม่ และแนวปฏิบัติด้านความปลอดภัยระดับองค์กร

### 👥 User Roles | กลุ่มผู้ใช้งาน

**English:**
1. **Buyer**: Farmers, students, or individuals interested in agricultural technology
2. **Seller**: Shops or individuals who want to list products on the platform
3. **Admin**: System developers who approve sellers and manage master data

**ภาษาไทย:**
1. **ผู้ซื้อ (Buyer)**: เกษตรกร, นักศึกษา, หรือบุคคลทั่วไปที่สนใจเทคโนโลยีการเกษตร
2. **ผู้ขาย (Seller)**: ร้านค้าหรือบุคคลที่ต้องการนำสินค้ามาลงขายบนแพลตฟอร์ม
3. **ผู้ดูแลระบบ (Admin)**: ผู้พัฒนาระบบที่ทำหน้าที่อนุมัติผู้ขายและจัดการข้อมูลหลัก

---

## 🏗️ System Architecture | สถาปัตยกรรมระบบ

**English:**  
We use a **Client-to-API-to-Backend-to-API-to-Database** architecture pattern with Next.js as the core framework and TypeScript throughout the entire stack. The system is designed with separation of concerns, where the frontend communicates with a dedicated API layer, which then interacts with backend services that handle business logic and database operations.

**ภาษาไทย:**  
เราใช้สถาปัตยกรรมแบบ **Client-to-API-to-Backend-to-API-to-Database** โดยมี Next.js เป็นเฟรมเวิร์กหลักและใช้ TypeScript ตลอดทั้งสแต็ก ระบบถูกออกแบบด้วยการแยกส่วนการทำงานอย่างชัดเจน โดยที่ส่วนหน้าบ้าน (Frontend) จะสื่อสารกับเลเยอร์ API เฉพาะ ซึ่งจะทำหน้าที่ติดต่อกับบริการ Backend ที่จัดการตรรกะทางธุรกิจและการดำเนินการกับฐานข้อมูล

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   Buyer (Web/Mobile) │  │  Seller (Browser)   │  │   Admin (Dashboard) │
└──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (TypeScript)                      │
│              ┌─────────────────────────────────────┐                  │
│              │   API Client Layer with Interceptors │                  │
│              │   - Authentication Headers          │                  │
│              │   - Error Handling                  │                  │
│              │   - Request/Response Transformation │                  │
│              └─────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────────┘
                                    │ Internal API Calls
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                 Next.js API Routes (Backend Layer)                    │
│              ┌─────────────────────────────────────┐                  │
│              │   Service Layer (Business Logic)    │                  │
│              │   - Validation (Zod)                │                  │
│              │   - Authorization Middleware        │                  │
│              │   - Rate Limiting                   │                  │
│              │   - Audit Logging                   │                  │
│              └─────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────────┘
                                    │ Secure DB Connection
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL + Auth)                       │
│              ┌─────────────────────────────────────┐                  │
│              │   Repository Pattern                │                  │
│              │   - Query Optimization              │                  │
│              │   - Transaction Management          │                  │
│              │   - Row Level Security (RLS)        │                  │
│              └─────────────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack | เทคโนโลยีที่ใช้

### Frontend | ส่วนหน้าบ้าน
**English:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x
- **State Management:** React Query (TanStack Query)
- **Form Handling:** React Hook Form + Zod
- **UI Components:** Radix UI + Custom Components
- **Animations:** Framer Motion

**ภาษาไทย:**
- **เฟรมเวิร์ก:** Next.js 15 (App Router)
- **ภาษา:** TypeScript 5.x
- **สไตล์:** Tailwind CSS 4.x
- **การจัดการ State:** React Query (TanStack Query)
- **การจัดการฟอร์ม:** React Hook Form + Zod
- **คอมโพเนนต์ UI:** Radix UI + Custom Components
- **อนิเมชั่น:** Framer Motion

### Backend | ส่วนหลังบ้าน
**English:**
- **Runtime:** Node.js 20+ / Bun
- **API Framework:** Next.js API Routes
- **Database ORM:** Supabase JS Client
- **Validation:** Zod
- **Authentication:** JWT + Supabase Auth
- **Security:** Helmet, CORS, Rate Limiting

**ภาษาไทย:**
- **รันไทม์:** Node.js 20+ / Bun
- **เฟรมเวิร์ก API:** Next.js API Routes
- **Database ORM:** Supabase JS Client
- **Validation:** Zod
- **Authentication:** JWT + Supabase Auth
- **Security:** Helmet, CORS, Rate Limiting

### Database | ฐานข้อมูล
**English:**
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Authentication
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

**ภาษาไทย:**
- **ฐานข้อมูล:** PostgreSQL (ผ่าน Supabase)
- **Auth:** Supabase Authentication
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime

### DevOps & Deployment
**English:**
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + Custom Logging
- **Testing:** Jest, React Testing Library, Playwright

**ภาษาไทย:**
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics + Custom Logging
- **Testing:** Jest, React Testing Library, Playwright

### AI & Thai Language Support | ปัญญาประดิษฐ์และภาษาไทย
**English:**
- **Thai LLM:** WangChanGLM, ThaiBERT
- **NLP Library:** PyThaiNLP
- **Features:** Thai text generation, sentiment analysis, semantic search

**ภาษาไทย:**
- **Thai LLM:** WangChanGLM, ThaiBERT
- **NLP Library:** PyThaiNLP
- **Features:** การสร้างข้อความภาษาไทย, วิเคราะห์ความรู้สึก, ค้นหาเชิงความหมาย

---

## ✨ Key Features | ฟีเจอร์หลัก

### Authentication & Authorization | การยืนยันตัวตนและการกำหนดสิทธิ์
**English:**
- Secure user registration and login with email verification
- Role-based access control (Buyer, Seller, Admin)
- JWT token management with refresh tokens
- Password reset functionality
- Session management and secure logout

**ภาษาไทย:**
- การลงทะเบียนและเข้าสู่ระบบอย่างปลอดภัยพร้อมการยืนยันอีเมล
- การควบคุมการเข้าถึงตามบทบาท (ผู้ซื้อ, ผู้ขาย, ผู้ดูแลระบบ)
- การจัดการโทเค็น JWT พร้อมรีเฟรชโทเค็น
- ฟังก์ชันรีเซ็ตรหัสผ่าน
- การจัดการเซสชันและการออกจากระบบอย่างปลอดภัย

### Product Management | การจัดการสินค้า
**English:**
- Complete CRUD operations for products
- Advanced search with filters and sorting
- Product categories and tags
- Image upload and optimization
- Inventory management
- Product reviews and ratings

**ภาษาไทย:**
- การดำเนินการ CRUD ครบถ้วนสำหรับสินค้า
- การค้นหาขั้นสูงพร้อมตัวกรองและการเรียงลำดับ
- หมวดหมู่และแท็กสินค้า
- การอัปโหลดและปรับ优化รูปภาพ
- การจัดการสต็อก
- รีวิวและให้คะแนนสินค้า

### Shopping Cart & Orders | ตะกร้าสินค้าและคำสั่งซื้อ
**English:**
- Real-time shopping cart management
- Secure checkout process
- Order tracking and history
- Multiple payment methods (PromptPay, GB Prime Pay, 2C2P)
- Invoice generation
- Return and refund processing

**ภาษาไทย:**
- การจัดการตะกร้าสินค้าแบบเรียลไทม์
- กระบวนการชำระเงินที่ปลอดภัย
- การติดตามและประวัติคำสั่งซื้อ
- ช่องทางการชำระเงินหลากหลาย (พร้อมเพย์, GB Prime Pay, 2C2P)
- การสร้างใบแจ้งหนี้
- การประมวลผลการคืนสินค้าและการคืนเงิน

### Admin Dashboard | แผงควบคุมผู้ดูแลระบบ
**English:**
- User management and approval workflow
- Product moderation
- Order management
- Sales analytics and reporting
- System monitoring
- Content management

**ภาษาไทย:**
- การจัดการผู้ใช้และขั้นตอนการอนุมัติ
- การตรวจสอบสินค้า
- การจัดการคำสั่งซื้อ
- การวิเคราะห์ยอดขายและการรายงาน
- การตรวจสอบระบบ
- การจัดการเนื้อหา

### Thai AI Integration | การผสาน AI ภาษาไทย
**English:**
- Thai language product search
- Sentiment analysis for reviews
- Automated Thai content generation
- Thai chatbot support
- Semantic understanding of Thai queries

**ภาษาไทย:**
- การค้นหาสินค้าด้วยภาษาไทย
- การวิเคราะห์ความรู้สึกสำหรับรีวิว
- การสร้างเนื้อหาภาษาไทยอัตโนมัติ
- การสนับสนุนแชทบอทภาษาไทย
- ความเข้าใจเชิงความหมายของคำค้นหาภาษาไทย

---

## 🔒 Security | ความปลอดภัย

**English:**  
This project implements enterprise-level security measures across all layers:

- **Network Security:** HTTPS enforcement, CORS configuration, HSTS headers
- **Application Security:** Input validation, SQL injection prevention, XSS protection, CSRF tokens
- **Authentication:** JWT with short expiration, refresh tokens, secure password hashing (Argon2)
- **Authorization:** Role-based access control, resource-level permissions
- **Data Protection:** Encryption at rest and in transit, sensitive data masking
- **Rate Limiting:** API rate limiting, brute force protection
- **Audit Logging:** Comprehensive logging of all critical actions
- **Dependency Scanning:** Automated vulnerability detection

For detailed security information, see [SECURITY.md](./SECURITY.md)

**ภาษาไทย:**  
โครงการนี้ใช้มาตรการความปลอดภัยระดับองค์กรในทุกเลเยอร์:

- **ความปลอดภัยเครือข่าย:** บังคับใช้ HTTPS, กำหนดค่า CORS, เฮดเดอร์ HSTS
- **ความปลอดภัยแอปพลิเคชัน:** การตรวจสอบอินพุต, ป้องกัน SQL injection, ป้องกัน XSS, โทเค็น CSRF
- **การยืนยันตัวตน:** JWT พร้อมอายุสั้น, รีเฟรชโทเค็น, การแฮชรหัสผ่านอย่างปลอดภัย (Argon2)
- **การกำหนดสิทธิ์:** การควบคุมการเข้าถึงตามบทบาท, สิทธิ์ระดับทรัพยากร
- **การปกป้องข้อมูล:** การเข้ารหัสทั้งขณะเก็บและส่ง, การปิดบังข้อมูลสำคัญ
- **การจำกัดอัตรา:** การจำกัดอัตรา API, การป้องกัน brute force
- **การบันทึกตรวจสอบ:** การบันทึกอย่างครอบคลุมของการกระทำที่สำคัญทั้งหมด
- **การสแกน dependencies:** การตรวจจับช่องโหว่อัตโนมัติ

สำหรับข้อมูลความปลอดภัยโดยละเอียด ดูที่ [SECURITY.md](./SECURITY.md)

---

## 🚀 Installation & Running | การติดตั้งและรันโปรเจกต์

### Prerequisites | ข้อกำหนดเบื้องต้น

**English:**
- Node.js 20+ or Bun 1.0+
- npm, yarn, pnpm, or bun
- Git
- Docker (optional, for containerized deployment)

**ภาษาไทย:**
- Node.js 20+ หรือ Bun 1.0+
- npm, yarn, pnpm, หรือ bun
- Git
- Docker (ไม่บังคับ, สำหรับการ deploy แบบคอนเทนเนอร์)

### Quick Start | เริ่มต้นอย่างรวดเร็ว

**English:**
```bash
# Clone the repository
git clone https://github.com/chakronwork/agri-tech-marketplace.git
cd agri-tech-marketplace

# Install dependencies
bun install
# or
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your Supabase credentials and other settings

# Run development server
bun dev
# or
npm run dev

# Open http://localhost:3000
```

**ภาษาไทย:**
```bash
# โคลน repository
git clone https://github.com/chakronwork/agri-tech-marketplace.git
cd agri-tech-marketplace

# ติดตั้ง dependencies
bun install
# หรือ
npm install

# คัดลอกไฟล์ environment variables
cp .env.example .env.local

# กำหนดค่า environment variables
# แก้ไข .env.local ด้วยข้อมูล Supabase และการตั้งค่าอื่นๆ ของคุณ

# รัน development server
bun dev
# หรือ
npm run dev

# เปิด http://localhost:3000
```

### Environment Variables | ตัวแปรสภาพแวดล้อม

**English:**  
Create a `.env.local` file in the root directory with the following variables:

**ภาษาไทย:**  
สร้างไฟล์ `.env.local` ในไดเรกทอรีรากด้วยตัวแปรต่อไปนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# Payment Gateway (configure based on selected provider)
PAYMENT_API_KEY=your_payment_api_key
PAYMENT_SECRET=your_payment_secret

# AI Services (Thai LLM)
THAI_LLM_API_URL=your_thai_llm_api_url
THAI_LLM_API_KEY=your_thai_llm_api_key
```

---

## 🐳 Docker Deployment | การใช้งาน Docker

**English:**  
This project supports containerized deployment using Docker and Docker Compose for consistent environments across development, staging, and production.

**ภาษาไทย:**  
โปรเจกต์นี้รองรับการ deploy แบบคอนเทนเนอร์โดยใช้ Docker และ Docker Compose เพื่อสภาพแวดล้อมที่สอดคล้องกันระหว่าง development, staging, และ production

### Docker Quick Start | เริ่มต้นใช้งาน Docker อย่างรวดเร็ว

**English:**
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild without cache
docker-compose up --build --no-cache
```

**ภาษาไทย:**
```bash
# Build และรันด้วย Docker Compose
docker-compose up --build

# หรือรันในโหมด detached
docker-compose up -d --build

# ดู logs
docker-compose logs -f

# หยุด containers
docker-compose down

# Build ใหม่โดยไม่ใช้ cache
docker-compose up --build --no-cache
```

### Docker Configuration | การกำหนดค่า Docker

**English:**  
The project includes:
- `Dockerfile`: Multi-stage build for optimized production image
- `docker-compose.yml`: Orchestrates app, database, and supporting services
- `.dockerignore`: Excludes unnecessary files from the build context

**ภาษาไทย:**  
โปรเจกต์ประกอบด้วย:
- `Dockerfile`: การ build แบบ multi-stage สำหรับ image production ที่เหมาะสม
- `docker-compose.yml`: จัดการ app, database, และบริการเสริม
- `.dockerignore`: ยกเว้นไฟล์ที่ไม่จำเป็นออกจาก build context

### Production Deployment with Docker | การ Deploy Production ด้วย Docker

**English:**
```bash
# Build production image
docker build -t agri-tech-marketplace:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  --name agri-tech-app \
  agri-tech-marketplace:latest
```

**ภาษาไทย:**
```bash
# Build production image
docker build -t agri-tech-marketplace:latest .

# รัน production container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  --name agri-tech-app \
  agri-tech-marketplace:latest
```

---

## 📁 Folder Structure | โครงสร้างโฟลเดอร์

```
agri-tech-marketplace/
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions and configurations
│   ├── types/                # TypeScript type definitions
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client and business logic
│   ├── stores/               # State management (Zustand/Context)
│   ├── styles/               # Global styles and Tailwind config
│   └── utils/                # Helper functions
├── public/                   # Static assets
├── docker/                   # Docker configuration files
├── tests/                    # Test files
├── docs/                     # Documentation
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile                # Docker build instructions
├── next.config.js            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # This file
├── SECURITY.md               # Security documentation
├── LICENSE                   # MIT License with restrictions
└── todo.md                   # Development roadmap
```

---

## 🎯 Architecture Decisions | การตัดสินใจทางสถาปัตยกรรม

### Why TypeScript? | ทำไมต้องใช้ TypeScript?

**English:**
- Type safety across the entire stack
- Better IDE support and autocompletion
- Early error detection during development
- Improved code maintainability and refactoring
- Self-documenting code through type definitions

**ภาษาไทย:**
- ความปลอดภัยของประเภทข้อมูลตลอดทั้งสแต็ก
- การสนับสนุนจาก IDE ที่ดีขึ้นและ autocomplete
- การตรวจจับข้อผิดพลาดตั้งแต่ในช่วงพัฒนา
- การบำรุงรักษาโค้ดที่ดีขึ้นและการ refactoring
- โค้ดที่เอกสารในตัวผ่านนิยามประเภท

### Why Client-to-API-to-Backend-to-API-to-Database? | ทำไมต้องใช้สถาปัตยกรรมนี้?

**English:**
- Clear separation of concerns
- Independent scaling of frontend and backend
- Enhanced security through API abstraction
- Better testability of individual components
- Flexibility to change underlying technologies
- Improved maintainability and team collaboration

**ภาษาไทย:**
- การแยกส่วนการทำงานอย่างชัดเจน
- การขยายขนาด frontend และ backend ได้อย่างอิสระ
- ความปลอดภัยที่เพิ่มขึ้นผ่านการ抽象 API
- การทดสอบแต่ละคอมโพเนนต์ได้ดีขึ้น
- ความยืดหยุ่นในการเปลี่ยนเทคโนโลยีพื้นฐาน
- การบำรุงรักษาและความร่วมมือในทีมที่ดีขึ้น

### Why Next.js? | ทำไมต้องใช้ Next.js?

**English:**
- Server-side rendering (SSR) and static site generation (SSG)
- Built-in API routes for backend functionality
- Excellent TypeScript support
- Optimized performance out of the box
- Large ecosystem and community support

**ภาษาไทย:**
- Server-side rendering (SSR) และ static site generation (SSG)
- API routes ในตัวสำหรับฟังก์ชัน backend
- การสนับสนุน TypeScript ที่ดีเยี่ยม
- ประสิทธิภาพที่เหมาะสมทันที
- ระบบนิเวศและชุมชนขนาดใหญ่

---

## 📅 Roadmap

### Phase 1: TypeScript Migration (Completed)
- [x] Project setup with TypeScript
- [x] Type definitions creation
- [x] Core infrastructure migration

### Phase 2: Backend API Development (In Progress)
- [ ] Complete RESTful API v1
- [ ] Service layer implementation
- [ ] Authentication middleware
- [ ] Payment gateway integration (Thai providers)

### Phase 3: Frontend Refactoring (Planned)
- [ ] API client implementation
- [ ] State management migration
- [ ] Component updates
- [ ] Form handling improvements

### Phase 4: UX/UI Enhancement (Planned)
- [ ] Design system creation
- [ ] Responsive improvements
- [ ] Accessibility compliance
- [ ] Dark mode implementation

### Phase 5: Thai AI Integration (Planned)
- [ ] WangChanGLM integration
- [ ] Thai NLP features
- [ ] Semantic search
- [ ] Chatbot functionality

### Phase 6: Testing & QA (Planned)
- [ ] Unit testing
- [ ] Integration testing
- [ ] E2E testing
- [ ] Performance optimization

### Phase 7: Deployment & Monitoring (Planned)
- [ ] CI/CD pipeline
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation finalization

---

## 📧 Contact | ติดต่อผู้พัฒนา

**English:**
- **Name:** Chakron Yuraket
- **Email:** chakronwork@gmail.com
- **GitHub:** [chakronwork](https://github.com/chakronwork)
- **Portfolio:** Available upon request

**ภาษาไทย:**
- **ชื่อ:** ชาคร ยุระเกตุ
- **อีเมล:** chakronwork@gmail.com
- **GitHub:** [chakronwork](https://github.com/chakronwork)
- **พอร์ตโฟลิโอ:** มีให้บริการเมื่อร้องขอ

---

## 📄 License | ใบอนุญาต

**English:**  
This project is licensed under the MIT License with specific restrictions.

**Copyright (c) 2024 Chakron Yuraket. All Rights Reserved.**

**IMPORTANT RESTRICTIONS:**
1. This software is provided exclusively as a portfolio piece for job applications by Chakron Yuraket.
2. **Copying, cloning, reproducing, or distributing this code for any purpose other than review is strictly prohibited.**
3. **Claiming ownership, authorship, or presenting this work as your own is forbidden and will result in legal action.**
4. Using this code for commercial purposes without explicit written permission from the author is not allowed.
5. Any violation of these terms will be pursued legally to the fullest extent of the law.

For permission requests or licensing inquiries, please contact: chakronwork@gmail.com

**ภาษาไทย:**  
โปรเจกต์นี้ได้รับอนุญาตภายใต้ MIT License พร้อมข้อกำหนดเฉพาะ

**ลิขสิทธิ์ (c) 2024 ชาคร ยุระเกตุ สงวนลิขสิทธิ์**

**ข้อกำหนดสำคัญ:**
1. ซอฟต์แวร์นี้จัดทำขึ้นเฉพาะเป็นชิ้นงานพอร์ตโฟลิโอสำหรับการสมัครงานโดย ชาคร ยุระเกตุ เท่านั้น
2. **ห้ามมิให้คัดลอก โคลน ทำซ้ำ หรือแจกจ่ายโค้ดนี้เพื่อวัตถุประสงค์อื่นใดนอกเหนือจากการตรวจสอบโดยเด็ดขาด**
3. **ห้ามมิให้กล่าวอ้างความเป็นเจ้าของ การเป็นผู้เขียน หรือนำเสนอผลงานนี้เป็นของตนเอง โดยผู้ละเมิดจะถูกลงโทษตามกฎหมาย**
4. ห้ามมิให้นำโค้ดนี้ไปใช้เพื่อวัตถุประสงค์ทางการค้าโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากผู้เขียนอย่างชัดเจน
5. การละเมิดข้อกำหนดใดๆ จะถูกดำเนินคดีตามกฎหมายถึงที่สุด

สำหรับการขออนุญาตหรือสอบถามเรื่องลิขสิทธิ์ กรุณาติดต่อ: chakronwork@gmail.com

---

<div align="center">

**Developed with ❤️ by Chakron Yuraket**  
พัฒนาด้วยความรักโดย ชาคร ยุระเกตุ

[![GitHub](https://img.shields.io/badge/GitHub-chakronwork-blue)](https://github.com/chakronwork)
[![Email](https://img.shields.io/badge/Email-chakronwork@gmail.com-red)](mailto:chakronwork@gmail.com)

</div>
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │  ┌──────────────────────┐  ┌─────────────────────────────┐    │ │
│  │  │  Presentation Layer  │  │   Business Logic Layer      │    │ │
│  │  │  (Frontend)          │  │   (Backend API)             │    │ │
│  │  │ • React Components   │  │ • API Routes                │    │ │
│  │  │ • App Router Pages   │  │ • Server Actions            │    │ │
│  │  │ • Tailwind CSS UI    │  │ • Authentication Checks     │    │ │
│  │  │ • Context API State  │  │ • Data Validation (Zod)     │    │ │
│  │  └──────────┬───────────┘  └─────────────┬───────────────┘    │ │
│  │             └────────────────┬───────────┘                    │ │
│  │                   ┌──────────▼──────────┐                     │ │
│  │                   │  Data Access Layer  │                     │ │
│  │                   │ (Supabase JS Client)│                     │ │
│  │                   └──────────┬──────────┘                     │ │
│  └──────────────────────────────┼────────────────────────────────┘ │
└─────────────────────────────────┼──────────────────────────────────┘
                                  │ HTTPS / RESTful API / RPC
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Supabase (Backend as a Service)                    │
├───────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐        ┌───────────────────────────┐   │
│  │  Application Services   │        │     Data Services         │   │
│  │  • Auth (GoTrue)        │        │  • PostgreSQL Database    │   │
│  │  • Storage (S3-like)    │        │  • Row Level Security     │   │
│  │  • Edge Functions       │        │  • Stored Functions (RPC) │   │
│  └─────────────────────────┘        └───────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **User → Next.js Frontend**: ผู้ใช้โต้ตอบผ่าน UI
2. **Frontend → Next.js API**: ส่งคำขอไปยัง API Routes หรือ Server Actions
3. **API → Supabase Client**: เรียกใช้ Supabase JS Client
4. **Supabase Client → Supabase Backend**: ส่งคำขอผ่าน HTTPS/REST/RPC
5. **Supabase RLS**: ตรวจสอบสิทธิ์การเข้าถึงข้อมูล (Security Gate)
6. **Response**: ข้อมูลถูกส่งกลับตามเส้นทางเดิม

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: JavaScript
- **UI Framework**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Context API

### Backend
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Authentication (GoTrue)
  - Storage (S3-compatible)
  - Row Level Security (RLS)
  - Database Functions (RPC)

### Development & Deployment
- **Runtime**: [Bun](https://bun.sh/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Version Control**: Git

### Additional Tools
- **Data Validation**: Zod
- **Image Optimization**: Next.js Image Component
- **AI Bot : Gmmini Api Key**
- **IDE : VS Code**

## ✨ ฟีเจอร์หลัก

### ✅ สิ่งที่ทำแล้ว (Implemented)

#### 🔐 ระบบยืนยันตัวตน (Authentication)
- สมัครสมาชิก (Register) และเข้าสู่ระบบ (Login)
- จัดการ Session ของผู้ใช้ทั่วทั้งแอปพลิเคชัน
- JWT Token-based authentication

#### 📦 ระบบจัดการสินค้า (Product Management)
- ผู้ขายสามารถเพิ่มสินค้าใหม่เข้าร้านของตนเองได้ (Create)
- อัปโหลดรูปภาพสินค้าไปจัดเก็บบน Supabase Storage
- ผู้ใช้ทั่วไปสามารถดูรายการสินค้าทั้งหมดได้ (Read)
- รองรับการอัปโหลดรูปภาพหลายรูปต่อสินค้า

#### 🔒 ความปลอดภัย (Security)
- **Row Level Security (RLS)**: บังคับใช้สิทธิ์การเข้าถึงข้อมูลในระดับฐานข้อมูล
- **API Protection**: ป้องกันการเข้าถึง API ที่ไม่ได้รับอนุญาต
- **XSS Prevention**: กำหนด Hostname ที่อนุญาตสำหรับรูปภาพใน Next.js
- **Transaction Support**: ใช้ PostgreSQL Functions เพื่อความสมบูรณ์ของข้อมูล

## 🚀 การติดตั้งและรันโปรเจกต์

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 หรือสูงกว่า)
- [Node.js](https://nodejs.org/) (v18 หรือสูงกว่า) - สำหรับ alternative runtime
- Account ของ [Supabase](https://supabase.com/)
- Git

### ขั้นตอนการติดตั้ง

#### 1. Clone โปรเจกต์
```bash
git clone [URL ของโปรเจกต์]
cd agri-tech-marketplace
```

#### 2. ติดตั้ง Dependencies
```bash
bun install
```

หรือใช้ npm/yarn/pnpm:
```bash
npm install
# หรือ
yarn install
# หรือ
pnpm install
```

#### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local` ที่ Root ของโปรเจกต์:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
```

**หาค่าเหล่านี้ได้จาก:**
- Supabase Dashboard → `Settings` → `API`

#### 4. ตั้งค่า Database Schema & RLS

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. รันไฟล์ `supabase/schema.sql` เพื่อสร้าง:
   - Tables: `profiles`, `products`, `product_images`, etc.
   - RLS Policies สำหรับทุก table
   - Database Functions (RPC)
   - Indexes สำหรับประสิทธิภาพ

#### 5. ตั้งค่า Supabase Storage

1. ไปที่ `Storage` ใน Supabase Dashboard
2. สร้าง Bucket ชื่อ `product-images`
3. ตั้งค่า Storage Policies:
   ```sql
   -- อนุญาตให้ทุกคนอ่านรูปภาพ
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'product-images' );
   
   -- อนุญาตให้ authenticated users อัปโหลด
   CREATE POLICY "Authenticated Upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'product-images' 
     AND auth.role() = 'authenticated'
   );
   ```

#### 6. รัน Development Server

```bash
bun dev
```

หรือ:
```bash
npm run dev
```

แอปพลิเคชันจะพร้อมใช้งานที่ **http://localhost:3000**

### 📝 Scripts ที่มีให้ใช้

```bash
bun dev          # รัน development server
bun build        # Build สำหรับ production
bun start        # รัน production server
bun lint         # ตรวจสอบ code quality
```

## 📁 โครงสร้างโฟลเดอร์

```
agri-tech-marketplace/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (main)/              # Main application routes
│   │   ├── products/
│   │   └── dashboard/
│   ├── api/                 # API Routes
│   │   └── products/
│   ├── layout.js            # Root layout
│   └── page.js              # Home page
├── components/              # React Components
│   ├── ui/                  # UI components
│   ├── products/            # Product-related components
│   └── auth/                # Auth-related components
├── lib/                     # Utility functions
│   ├── supabase/           # Supabase clients
│   │   ├── client.js       # Browser client
│   │   ├── server.js       # Server client
│   │   └── admin.js        # Admin client
│   └── validations/        # Zod schemas
├── public/                  # Static files
├── supabase/               # Supabase configuration
│   ├── schema.sql          # Database schema
│   └── migrations/         # Database migrations
├── .env.local              # Environment variables (not in repo)
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Dependencies
```

## 🎯 การตัดสินใจทางสถาปัตยกรรม

### 1. Supabase แทนการสร้าง Backend เอง

**เหตุผล:**
- ลดเวลาในการพัฒนาอย่างมาก
- มีฟีเจอร์ความปลอดภัยในตัว (RLS, JWT)
- PostgreSQL ที่มีประสิทธิภาพสูง
- Storage และ Authentication ที่พร้อมใช้งาน

**Trade-offs:**
- Vendor lock-in กับ Supabase
- จำกัดการ customize บางส่วน

### 2. Row Level Security (RLS)

**เหตุผล:**
- Security at Database Level = ปราการด่านสุดท้าย
- ป้องกัน SQL Injection
- ไม่ต้องเขียน Authorization Logic ซ้ำในทุก API
- ตรวจสอบสิทธิ์อัตโนมัติแม้ใช้ Direct Database Access

**ตัวอย่าง Policy:**
```sql
-- ผู้ขายดูได้เฉพาะสินค้าของตนเอง
CREATE POLICY "Sellers can view own products"
ON products FOR SELECT
USING (seller_id = auth.uid());
```

### 3. PostgreSQL Functions (RPC) สำหรับ Atomic Operations

**เหตุผล:**
- รับประกัน Transaction Integrity
- ลด Network Roundtrips
- Business Logic ที่ซับซ้อนทำในฝั่ง Database (เร็วกว่า)

**ตัวอย่าง:**
```sql
CREATE FUNCTION create_product_with_images(...)
RETURNS uuid AS $$
BEGIN
  -- Insert product
  INSERT INTO products ...;
  
  -- Insert images
  INSERT INTO product_images ...;
  
  RETURN product_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. Next.js App Router

**เหตุผล:**
- Server Components = Reduced JavaScript Bundle
- Built-in API Routes = ไม่ต้องสร้าง Backend แยก
- File-based Routing = เข้าใจง่าย
- Streaming และ Suspense Support

## 🗺️ Roadmap

### Phase 1: Core Features (✅ เสร็จแล้ว)
- [x] Authentication System
- [x] Product CRUD (Create, Read)
- [x] Image Upload
- [x] RLS Implementation

### Phase 2: Buyer Features (🚧 กำลังทำ)
- [ ] Shopping Cart
- [ ] Order Placement (Simulation)
- [ ] Product datali
- [ ] Product Reviews & Ratings
- [ ] Search & Filter Products
- [ ] User Profile Management

### Phase 3: Seller Features
- [ ] Seller Dashboard
- [ ] Order Management
- [ ] Inventory Management
- [ ] Sales Analytics
- [ ] Product Update & Delete

### Phase 4: Admin Features
- [ ] Seller Approval System
- [ ] Category Management
- [ ] User Management
- [ ] Platform Analytics
- [ ] Content Moderation

### Phase 5: Advanced Features
- [ ] Real-time Notifications
- [ ] Chat System (Buyer-Seller)
- [ ] Payment Gateway Integration
- [ ] Multi-language Support
- [ ] Mobile App (React Native)

## 🤝 Contributing

เนื่องจากนี่เป็นโครงงานจบการศึกษา เราไม่เปิดรับ contribution จากภายนอกในขณะนี้ แต่หากมีข้อเสนอแนะหรือพบ bug สามารถเปิด Issue ได้เลย

## 📄 License

โปรเจกต์นี้สร้างขึ้นเพื่อการศึกษา (Educational Purpose)



**Built with ❤️ using Next.js and Supabase**
