# Phoenix Market Database Setup

Your database has been restored but is empty. You need to initialize the schema by running the initialization script.

## Quick Setup

1. **Open the Supabase SQL Editor**:
   - Go to https://supabase.com/dashboard/project/keubztzjzkxduswifyyp
   - Click on "SQL Editor" in the left sidebar

2. **Run the initialization script**:
   - Copy the entire contents of `scripts/000_init_database.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

3. **Verify the setup**:
   - You should see a success message
   - Go to "Table Editor" to see all your tables created

## Default Admin Account

After running the script, you can log in with:
- **Username**: `Kaptein`
- **Password**: `admin123` (CHANGE THIS IMMEDIATELY)

## Tables Created

The script creates the following tables:
- `users` - Customer accounts
- `admins` - Admin accounts
- `categories` - Product categories (with subcategory support)
- `vendors` - Vendor profiles
- `products` - Product listings
- `wallets` - User wallet balances
- `wallet_transactions` - Transaction history
- `orders` - Order management

All tables include proper RLS policies, indexes, and foreign key relationships.

## What's Next?

After the database is initialized:
1. Log in to `/admin/login` with the credentials above
2. Change the default admin password
3. Create product categories
4. Start adding products
5. Configure your BTC wallet address for payments

## Troubleshooting

If you see errors about existing policies, that's normal - the script is idempotent and won't create duplicates.

If tables don't appear, make sure you're looking in the `public` schema.
