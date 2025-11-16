import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import bcrypt from "bcryptjs"

// This endpoint should only be used once to set up initial admin and user accounts
// After setup, you should disable or remove this endpoint for security
export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting setup process...")

    const { searchParams } = new URL(request.url)
    const force = searchParams.get("force") === "true"
    console.log("[v0] Force update mode:", force)

    const supabase = createAdminClient()

    console.log("[v0] Supabase admin client created successfully")

    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from("admins")
      .select("id, username")
      .eq("username", "Kaptein")
      .maybeSingle()

    if (checkAdminError) {
      console.error("[v0] Error checking for existing admin:", checkAdminError)
      return NextResponse.json(
        { error: "Failed to check existing admin", details: checkAdminError.message },
        { status: 500 },
      )
    }

    let admin = existingAdmin

    if (existingAdmin && force) {
      console.log("[v0] Force updating admin password...")
      const adminPasswordHash = await bcrypt.hash("89000331Adp!", 10)

      const { error: updateError } = await supabase
        .from("admins")
        .update({ password_hash: adminPasswordHash })
        .eq("username", "Kaptein")

      if (updateError) {
        console.error("[v0] Admin update error:", updateError)
        return NextResponse.json({ error: "Failed to update admin", details: updateError.message }, { status: 500 })
      }

      console.log("[v0] Admin password updated successfully")
    } else if (!existingAdmin) {
      console.log("[v0] Creating admin user...")

      // Hash the password for admin
      const adminPasswordHash = await bcrypt.hash("89000331Adp!", 10)

      // Insert admin user
      const { data: newAdmin, error: adminError } = await supabase
        .from("admins")
        .insert({
          username: "Kaptein",
          password_hash: adminPasswordHash,
        })
        .select("id, username")
        .single()

      if (adminError) {
        console.error("[v0] Admin creation error:", adminError)
        return NextResponse.json({ error: "Failed to create admin user", details: adminError.message }, { status: 500 })
      }

      admin = newAdmin
      console.log("[v0] Admin created successfully:", admin)
    } else {
      console.log("[v0] Admin already exists, skipping creation")
    }

    const { data: existingUser, error: checkUserError } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", "Kaptein")
      .maybeSingle()

    if (checkUserError) {
      console.error("[v0] Error checking for existing user:", checkUserError)
      return NextResponse.json(
        { error: "Failed to check existing user", details: checkUserError.message },
        { status: 500 },
      )
    }

    let user = existingUser

    if (existingUser && force) {
      console.log("[v0] Force updating user password and PIN...")
      const userPasswordHash = await bcrypt.hash("89000331Adp!", 10)
      const userPinHash = await bcrypt.hash("123456", 10)

      const { error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: userPasswordHash,
          pin_hash: userPinHash,
        })
        .eq("username", "Kaptein")

      if (updateError) {
        console.error("[v0] User update error:", updateError)
        return NextResponse.json({ error: "Failed to update user", details: updateError.message }, { status: 500 })
      }

      console.log("[v0] User password and PIN updated successfully")
    } else if (!existingUser) {
      console.log("[v0] Creating regular user...")

      // Hash password and PIN for regular user
      const userPasswordHash = await bcrypt.hash("89000331Adp!", 10)
      const userPinHash = await bcrypt.hash("123456", 10) // Default PIN for testing

      // Insert regular user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          username: "Kaptein",
          password_hash: userPasswordHash,
          pin_hash: userPinHash,
        })
        .select("id, username")
        .single()

      if (userError) {
        console.error("[v0] User creation error:", userError)
        return NextResponse.json({ error: "Failed to create user", details: userError.message }, { status: 500 })
      }

      user = newUser
      console.log("[v0] User created successfully:", user)
    } else {
      console.log("[v0] User already exists, skipping creation")
    }

    return NextResponse.json(
      {
        success: true,
        message:
          existingAdmin && existingUser && !force
            ? "Setup already completed. Accounts are ready to use! Use ?force=true to reset passwords."
            : force
              ? "Passwords reset successfully!"
              : "Setup completed successfully!",
        admin: { id: admin.id, username: admin.username },
        user: { id: user.id, username: user.username },
        credentials: {
          admin: {
            username: "Kaptein",
            password: "89000331Adp!",
            loginUrl: "/admin/login",
          },
          user: {
            username: "Kaptein",
            password: "89000331Adp!",
            pin: "123456",
            loginUrl: "/auth/login",
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json({ error: "Setup failed", details: String(error) }, { status: 500 })
  }
}

// GET endpoint to check if setup is needed
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: adminExists } = await supabase.from("admins").select("id").limit(1).maybeSingle()

    const { data: userExists } = await supabase.from("users").select("id").limit(1).maybeSingle()

    return NextResponse.json({
      setupNeeded: !adminExists || !userExists,
      adminExists: !!adminExists,
      userExists: !!userExists,
    })
  } catch (error) {
    console.error("[v0] Setup check error:", error)
    return NextResponse.json({ error: "Failed to check setup status", details: String(error) }, { status: 500 })
  }
}
