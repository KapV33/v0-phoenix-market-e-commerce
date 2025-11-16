# Phoenix Market - Quick Start Guide

## 🔥 Welcome to Phoenix Market

Your digital marketplace with crypto payments is ready! Follow these simple steps to get started.

---

## Step 1: Initialize the Database

**Visit the setup page:** `/setup`

This will create your admin and user accounts automatically.

---

## Step 2: Login Credentials

After running setup, you'll receive these credentials:

### Admin Account
- **Username:** `Kaptein`
- **Password:** `89000331Adp!`
- **Login URL:** `/admin/login`

### User Account (for testing marketplace)
- **Username:** `Kaptein`
- **Password:** `89000331Adp!`
- **PIN:** `123456`
- **Login URL:** `/auth/login`

---

## Step 3: Access the Platform

### Admin Panel
1. Go to `/admin/login`
2. Enter your admin credentials
3. Access the dashboard at `/admin/dashboard`

**Admin Features:**
- Upload products via Excel
- Add/edit categories
- Add/edit individual products
- View statistics

### User Marketplace
1. Go to `/auth/login`
2. Enter username, password, and PIN
3. Browse products at `/market`

**User Features:**
- Browse products by category
- Add items to cart
- Checkout with crypto payments
- View order history

---

## Excel Upload Format

When uploading products via Excel, use this format:

| name | description | price | category_id | delivery_content | image_url | stock_quantity |
|------|-------------|-------|-------------|------------------|-----------|----------------|
| Product Name | Description | 99.99 | category-uuid | Digital content here | https://... | 100 |

**Note:** Get category IDs from the Categories tab in the admin panel.

---

## Crypto Payment Addresses

The system generates payment addresses for:
- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- USDT (Tether)

Customers enter their transaction hash after payment for verification.

---

## Security Notes

1. **Change default credentials** in production
2. **Disable/remove** the `/api/setup` endpoint after initial setup
3. **Enable HTTPS** in production
4. **Set up proper RLS policies** in Supabase for additional security

---

## Troubleshooting

### Login Failed
- Make sure you ran the setup at `/setup` first
- Check the browser console for error messages
- Verify database connection in Supabase

### Products Not Showing
- Add categories first in admin panel
- Then add products linked to those categories
- Make sure products are marked as "active"

### Payment Issues
- Verify crypto addresses are valid
- Check transaction hash format
- Ensure payment status updates correctly

---

## Support

For issues or questions:
1. Check browser console for `[v0]` debug messages
2. Verify Supabase connection and tables
3. Review the SETUP_GUIDE.md for detailed information

---

## Next Steps

1. ✅ Run setup at `/setup`
2. ✅ Login to admin panel
3. ✅ Add categories
4. ✅ Add products (manually or via Excel)
5. ✅ Test user login and marketplace
6. ✅ Test checkout flow

**Your Phoenix Market is ready to rise! 🔥**
