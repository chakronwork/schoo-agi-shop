# Agri-Tech Marketplace - Project Overview

## Project Description

Agri-Tech Marketplace is an E-Commerce platform designed as a marketplace for buying and selling modern agricultural equipment such as agricultural drones, IoT sensors, and high-tech tools. The platform connects buyers (farmers, students, general public) with sellers (shops, individuals) under admin supervision.

## Current Architecture

### System Type
Full-Stack Monolith with Next.js as the core framework and Supabase as Backend as a Service (BaaS).

### Tech Stack

**Frontend:**
- Framework: Next.js 15 (App Router)
- Language: JavaScript
- UI Framework: React 19
- Styling: Tailwind CSS v4
- State Management: React Context API

**Backend:**
- BaaS: Supabase
  - PostgreSQL Database
  - Authentication (GoTrue)
  - Storage (S3-compatible)
  - Row Level Security (RLS)
  - Database Functions (RPC)

**Runtime & Deployment:**
- Runtime: Bun / Node.js
- Deployment: Vercel

**Additional Tools:**
- Data Validation: Zod
- Image Optimization: Next.js Image Component
- AI Integration: Google Generative AI API
- Payment Gateway: Omise

### Current Data Flow

1. User interacts with Next.js Frontend (React Components)
2. Frontend sends requests to Next.js API Routes or Server Actions
3. API calls Supabase JavaScript Client
4. Supabase Client sends requests via HTTPS/REST/RPC to Supabase Backend
5. Supabase RLS validates data access permissions
6. Response flows back through the same path

### Key Features Implemented

**Authentication System:**
- User registration and login
- Session management across the application
- JWT Token-based authentication

**Product Management:**
- Sellers can create products in their stores
- Multiple image upload to Supabase Storage
- Public product browsing
- Product details and information display

**Security:**
- Row Level Security policies on all database tables
- API route protection
- XSS prevention through configured hostname allowlists
- Transaction support via PostgreSQL functions

**E-Commerce Features:**
- Shopping cart functionality
- Order placement system
- Order history tracking
- User profile management
- Storefront for sellers

### Project Structure

```
agri-tech-marketplace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (platform)/        # Main application routes
│   │   ├── api/               # API Routes
│   │   ├── cart/              # Cart pages
│   │   ├── checkout/          # Checkout flow
│   │   ├── orders/            # Order management
│   │   ├── product/           # Product details
│   │   ├── profile/           # User profiles
│   │   └── storefront/        # Seller storefronts
│   ├── components/            # React Components
│   │   ├── common/            # Shared components
│   │   └── features/          # Feature-specific components
│   ├── context/               # React Context providers
│   └── lib/                   # Utility functions
│       └── supabase/          # Supabase client configurations
├── public/                    # Static assets
├── package.json               # Dependencies
├── next.config.mjs            # Next.js configuration
├── tailwind.config.mjs        # Tailwind CSS configuration
└── README.md                  # Project documentation
```

## Current Limitations

1. **Direct Database Access**: Frontend communicates directly with Supabase, creating tight coupling between client and database schema
2. **JavaScript Codebase**: Lack of type safety leads to potential runtime errors
3. **Limited API Abstraction**: Business logic is distributed between frontend and database functions
4. **Scalability Concerns**: Direct database connections may limit horizontal scaling options
5. **API Versioning**: No clear API versioning strategy for future iterations

## Development Status

The project has completed Phase 1 (Core Features) and is currently implementing Phase 2 (Buyer Features). The foundation includes authentication, product management, basic e-commerce functionality, and security measures through RLS policies.
