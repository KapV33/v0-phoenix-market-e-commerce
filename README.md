# Phoenix Market

A comprehensive digital marketplace with crypto payment capabilities and auto-delivery system.

## Features

- **Custom Authentication**: Username, password, and 6-digit PIN with captcha protection
- **Dark Theme**: Charcoal background with red/orange/yellow gradient accents
- **Digital Products**: Auto-delivery system for digital content
- **Crypto Payments**: Support for Bitcoin, Ethereum, Litecoin, and USDT
- **Admin Dashboard**: Complete product and category management
- **Excel Import**: Bulk product upload via Excel files
- **Secure**: Row Level Security (RLS) and bcrypt password hashing

## Getting Started

### 1. Database Setup

Run the SQL scripts in order to set up your database:

\`\`\`bash
# Run these scripts in your Supabase SQL editor or via the v0 interface
scripts/001_create_users_table.sql
scripts/002_create_admins_table_v2.sql
scripts/003_create_categories_table.sql
scripts/004_create_products_table.sql
scripts/005_create_orders_table.sql
scripts/006_create_functions.sql
\`\`\`

### 2. Create Admin User

Run the setup script to create the admin user with proper password hashing:

\`\`\`bash
# This will create the admin user: Kaptein / 89000331Adp!
npm run setup-admin
# or
node --loader tsx scripts/setup-admin.ts
\`\`\`

### 3. Access the Application

#### User Access
- **URL**: `/auth/login` or `/auth/register`
- **Default User**: 
  - Username: `Kaptein`
  - Password: `89000331Adp!`
  - PIN: `123456`

#### Admin Access
- **URL**: `/admin/login`
- **Admin Credentials**:
  - Username: `Kaptein`
  - Password: `89000331Adp!`

## Admin Panel Features

### Product Management
- Create, edit, and delete products
- Set product prices, descriptions, and digital content
- Manage product stock and availability
- Upload products via Excel file

### Category Management
- Create and organize product categories
- Edit category names and descriptions
- Delete unused categories

### Excel Upload Format
Your Excel file should have the following columns:
- `name`: Product name
- `description`: Product description
- `price`: Product price (numeric)
- `category`: Category name
- `digital_content`: The digital content to deliver
- `stock`: Available stock (numeric)

## Routes

### Public Routes
- `/` - Redirects to login
- `/auth/login` - User login
- `/auth/register` - User registration

### Protected User Routes
- `/market` - Product marketplace
- `/market/checkout` - Checkout page
- `/market/orders` - Order history and downloads

### Protected Admin Routes
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin control panel

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **Row Level Security**: Database-level access control
- **Session Management**: Secure cookie-based sessions
- **Captcha Protection**: Prevents automated attacks
- **PIN Verification**: Additional security layer

## Crypto Payment Integration

The platform supports multiple cryptocurrencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Tether (USDT)

### Payment Flow
1. User adds products to cart
2. Selects cryptocurrency at checkout
3. System generates payment address
4. User sends payment and submits transaction hash
5. Admin verifies payment
6. Digital content is automatically delivered

## Production Checklist

- [x] Database schema with RLS policies
- [x] Secure password hashing
- [x] Admin authentication system
- [x] User authentication with PIN
- [x] Captcha protection
- [x] Product management
- [x] Category management
- [x] Excel import functionality
- [x] Crypto payment integration
- [x] Auto-delivery system
- [x] Middleware route protection
- [x] Dark theme with gradients
- [x] Responsive design

## Environment Variables

Required environment variables (automatically configured in v0):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: Custom with bcrypt
- **File Processing**: xlsx for Excel imports

## Support

For issues or questions, refer to the inline documentation in the code or check the admin dashboard for system status.
\`\`\`

\`\`\`json file="" isHidden
