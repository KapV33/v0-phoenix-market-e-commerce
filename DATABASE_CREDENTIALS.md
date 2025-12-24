# Phoenix Market Database Credentials

## Test Users

All test users have the same credentials for easy testing:
- **Password**: `password123`
- **PIN**: `1234`

### Regular Users
- Username: `testuser`
- Username: `buyer1`

### Vendor User
- Username: `vendor1`

### Admin User
- Username: `admin`
- Password: `password123`

## Initial Wallet Balances

All test users start with $100.00 in their wallets for testing purchases.

## How to Create New Users

Users can register through the `/auth/register` page. The system will automatically:
1. Hash the password using bcrypt
2. Hash the PIN using bcrypt
3. Create a wallet with $0.00 balance
4. Generate a unique user ID

## Database Access

The database connection details are stored in environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
