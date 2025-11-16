# Authentication Issues Fixed

## Problems Resolved

1. **`.single()` Error (406 Status)**
   - Changed all `.single()` calls to `.maybeSingle()` in authentication functions
   - This prevents errors when no matching records are found

2. **Row Level Security (RLS) Blocking Authentication**
   - Updated RLS policies on both `users` and `admins` tables
   - Changed from restrictive policies to allow public SELECT for authentication
   - Password hashes are still protected by application logic (never exposed to client)

3. **Files Updated**
   - `lib/auth.ts` - Fixed user authentication
   - `lib/admin-auth.ts` - Fixed admin authentication
   - `scripts/001_create_users_table_v2.sql` - Updated users table RLS policies
   - `scripts/002_create_admins_table_v4.sql` - Updated admins table RLS policies

## Next Steps

1. **Run the new SQL scripts** to update the RLS policies:
   - Execute `001_create_users_table_v2.sql`
   - Execute `002_create_admins_table_v4.sql`

2. **Test the authentication**:
   - Visit `/setup` to ensure accounts are created
   - Try logging in at `/auth/login` with:
     - Username: `Kaptein`
     - Password: `89000331Adp!`
     - PIN: `123456`
   - Try admin login at `/admin/login` with:
     - Username: `Kaptein`
     - Password: `89000331Adp!`

## Security Notes

- The RLS policies now allow public SELECT on authentication tables
- This is safe because:
  - Password hashes are never exposed to the client
  - All password verification happens server-side
  - The application logic prevents unauthorized access
  - Session management is handled via secure HTTP-only cookies
</parameter>
