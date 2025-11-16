// Setup script to create admin user with proper password hashing
// Run this script to create the admin user: Kaptein / 89000331Adp!

import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function setupAdmin() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Hash the password
  const password = "89000331Adp!"
  const passwordHash = await bcrypt.hash(password, 10)

  console.log("[v0] Creating admin user...")
  console.log("[v0] Username: Kaptein")
  console.log("[v0] Password: 89000331Adp!")

  // Insert admin user
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .upsert(
      {
        username: "Kaptein",
        password_hash: passwordHash,
      },
      { onConflict: "username" },
    )
    .select()

  if (adminError) {
    console.error("[v0] Error creating admin:", adminError)
    return
  }

  console.log("[v0] Admin user created successfully!")

  // Also create a regular user for testing
  const pinHash = await bcrypt.hash("123456", 10)

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert(
      {
        username: "Kaptein",
        password_hash: passwordHash,
        pin_hash: pinHash,
      },
      { onConflict: "username" },
    )
    .select()

  if (userError) {
    console.error("[v0] Error creating user:", userError)
    return
  }

  console.log("[v0] Regular user created successfully!")
  console.log("[v0] User credentials: Kaptein / 89000331Adp! / PIN: 123456")
  console.log("[v0] Setup complete!")
}

setupAdmin()
