# Phoenix Market - Setup Guide

## Quick Start

### Step 1: Run Database Scripts

Execute all SQL scripts in the `scripts/` folder in numerical order. In v0, you can run these directly:

1. `001_create_users_table.sql` - Creates users table
2. `002_create_admins_table_v2.sql` - Creates admins table
3. `003_create_categories_table.sql` - Creates categories table
4. `004_create_products_table.sql` - Creates products table
5. `005_create_orders_table.sql` - Creates orders table
6. `006_create_functions.sql` - Creates utility functions

### Step 2: Create Admin User

Run the setup script to create your admin account:

\`\`\`bash
npm run setup-admin
\`\`\`

This creates:
- **Admin Account**: Username: `Kaptein`, Password: `89000331Adp!`
- **Test User Account**: Username: `Kaptein`, Password: `89000331Adp!`, PIN: `123456`

### Step 3: Access the Platform

#### 🛒 User Marketplace
1. Navigate to your app URL (it will redirect to `/auth/login`)
2. Login with:
   - Username: `Kaptein`
   - Password: `89000331Adp!`
   - PIN: `123456`
   - Complete the captcha
3. You'll be redirected to `/market` - the product marketplace

#### 🛡️ Admin Panel
1. From the login page, click "Admin Panel" button
2. Or navigate directly to `/admin/login`
3. Login with:
   - Username: `Kaptein`
   - Password: `89000331Adp!`
4. You'll be redirected to `/admin/dashboard`

## Admin Panel Features

### Dashboard Overview
- View total products, categories, and orders
- Quick statistics at a glance
- Tabbed interface for easy navigation

### Product Management
- **Add Products**: Click "Add Product" button
- **Edit Products**: Click edit icon on any product
- **Delete Products**: Click delete icon (with confirmation)
- **Bulk Upload**: Use the "Upload Excel" tab to import multiple products

### Category Management
- **Add Categories**: Click "Add Category" button
- **Edit Categories**: Click edit icon on any category
- **Delete Categories**: Click delete icon (with confirmation)

### Excel Upload Format

Create an Excel file with these columns:

| name | description | price | category | digital_content | stock |
|------|-------------|-------|----------|-----------------|-------|
| Product 1 | Description here | 29.99 | Software | LICENSE-KEY-123 | 100 |
| Product 2 | Another product | 49.99 | Games | GAME-CODE-456 | 50 |

**Important Notes:**
- Category must exist before uploading products
- Price should be numeric (no currency symbols)
- Stock should be a whole number
- Digital content is what gets delivered to customers

## User Flow

### Registration
1. Go to `/auth/register`
2. Enter username, password, and 6-digit PIN
3. Complete captcha
4. Account created automatically

### Shopping
1. Browse products in the marketplace
2. Filter by category
3. Add products to cart (sidebar opens)
4. Click "Checkout" when ready

### Checkout & Payment
1. Review order summary
2. Select cryptocurrency (BTC, ETH, LTC, or USDT)
3. System generates payment address
4. Send payment to the address
5. Submit transaction hash
6. Wait for admin verification

### Order Delivery
1. Go to `/market/orders` to view your orders
2. Once payment is verified, status changes to "Completed"
3. Digital content is displayed
4. Click "Copy Content" to get your purchase

## Security Features

### Password Security
- All passwords hashed with bcrypt (10 rounds)
- No plain text passwords stored
- Secure session management

### Database Security
- Row Level Security (RLS) enabled
- Users can only see their own data
- Admins have separate access controls

### Route Protection
- Middleware protects all sensitive routes
- `/market/*` requires user authentication
- `/admin/*` requires admin authentication
- Automatic redirect to login if not authenticated

## Crypto Payment Verification

As an admin, you need to verify payments:

1. User submits transaction hash
2. Go to admin dashboard (future feature: order management)
3. Verify the transaction on blockchain explorer
4. Update order status to "Completed"
5. Digital content is automatically delivered

## Troubleshooting

### Can't Login
- Ensure database scripts have been run
- Verify admin user was created with setup script
- Check browser console for errors

### Products Not Showing
- Ensure products are marked as "in stock"
- Check that categories exist
- Verify database connection

### Excel Upload Fails
- Check file format matches template
- Ensure all required columns are present
- Verify categories exist before uploading products

## Production Deployment

### Before Going Live

1. **Change Default Credentials**
   - Update admin password in database
   - Create new admin accounts as needed

2. **Configure Crypto Wallets**
   - Set up real wallet addresses
   - Implement actual payment verification
   - Consider using payment gateway APIs

3. **Security Hardening**
   - Enable HTTPS
   - Set secure cookie flags
   - Implement rate limiting
   - Add CSRF protection

4. **Monitoring**
   - Set up error tracking
   - Monitor database performance
   - Track payment confirmations

## Support

For issues or questions:
- Check the main README.md
- Review inline code documentation
- Verify environment variables are set correctly

---

**Default Credentials Summary:**

| Account Type | Username | Password | PIN |
|--------------|----------|----------|-----|
| Admin | Kaptein | 89000331Adp! | N/A |
| User | Kaptein | 89000331Adp! | 123456 |

**Important URLs:**

- User Login: `/auth/login`
- User Register: `/auth/register`
- Admin Login: `/admin/login`
- Marketplace: `/market`
- Admin Dashboard: `/admin/dashboard`
\`\`\`
