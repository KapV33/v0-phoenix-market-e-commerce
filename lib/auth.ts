// Authentication utilities for Phoenix Market
import { createAdminClient } from "@/lib/supabase/admin"
import bcrypt from "bcryptjs"

export interface UserCredentials {
  username: string
  password: string
  pin: string
}

export interface AuthResult {
  success: boolean
  userId?: string
  error?: string
}

// Hash password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Hash PIN using bcrypt
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Verify PIN
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

// Register new user
export async function registerUser(credentials: UserCredentials): Promise<AuthResult> {
  try {
    const supabase = createAdminClient()

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", credentials.username)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: "Username already exists" }
    }

    // Hash password and PIN
    const passwordHash = await hashPassword(credentials.password)
    const pinHash = await hashPin(credentials.pin)

    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert({
        username: credentials.username,
        password_hash: passwordHash,
        pin_hash: pinHash,
      })
      .select("id")
      .maybeSingle()

    if (error) {
      console.error("[v0] Registration error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, userId: data?.id }
  } catch (error) {
    console.error("[v0] Registration exception:", error)
    return { success: false, error: "Registration failed" }
  }
}

// Login user
export async function loginUser(credentials: UserCredentials): Promise<AuthResult> {
  try {
    const supabase = createAdminClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash, pin_hash")
      .eq("username", credentials.username)
      .maybeSingle()

    if (error || !user) {
      console.log("[v0] User not found or error:", error)
      return { success: false, error: "Invalid credentials" }
    }

    // Verify password
    const passwordValid = await verifyPassword(credentials.password, user.password_hash)
    if (!passwordValid) {
      console.log("[v0] Password verification failed")
      return { success: false, error: "Invalid credentials" }
    }

    // Verify PIN
    const pinValid = await verifyPin(credentials.pin, user.pin_hash)
    if (!pinValid) {
      console.log("[v0] PIN verification failed")
      return { success: false, error: "Invalid PIN" }
    }

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("[v0] Login exception:", error)
    return { success: false, error: "Login failed" }
  }
}
