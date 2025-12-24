-- Seed database with test users
-- Password for all test users: password123
-- PIN for all test users: 1234

-- Test regular user
INSERT INTO users (id, username, password_hash, pin_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'testuser',
  '$2a$10$rZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- password123
  '$2a$10$aZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- 1234
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Test buyer user
INSERT INTO users (id, username, password_hash, pin_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'buyer1',
  '$2a$10$rZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- password123
  '$2a$10$aZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- 1234
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Test vendor user
INSERT INTO users (id, username, password_hash, pin_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'vendor1',
  '$2a$10$rZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- password123
  '$2a$10$aZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- 1234
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Create wallet for all users
INSERT INTO wallets (user_id, balance, created_at, updated_at)
SELECT id, 100.00, NOW(), NOW()
FROM users
WHERE username IN ('testuser', 'buyer1', 'vendor1')
ON CONFLICT (user_id) DO NOTHING;

-- Create admin user
INSERT INTO admins (id, username, password_hash, btc_wallet_address, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin',
  '$2a$10$rZ5YMYHvJ3qQJ8YQJxZxHuYXQH5YxQJ8YQJxZxHuYXQH5YxQJ8YQJ',  -- password123
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;
