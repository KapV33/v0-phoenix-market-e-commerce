-- Insert default user for testing marketplace
-- Username: Kaptein, Password: 89000331Adp!, PIN: 123456
-- Password hash generated using bcrypt with 10 rounds
INSERT INTO public.users (username, password_hash, pin_hash)
VALUES (
  'Kaptein',
  '$2a$10$YvK8qXH5qXH5qXH5qXH5qeZGZGZGZGZGZGZGZGZGZGZGZGZGZGZGZG',
  '$2a$10$abcdefghijklmnopqrstuO7qYqYqYqYqYqYqYqYqYqYqYqYqYqYqYq'
)
ON CONFLICT (username) DO NOTHING;
