import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting image upload...")

    let formData: FormData
    try {
      formData = await request.formData()
      console.log("[v0] FormData parsed successfully")
    } catch (formDataError) {
      console.error("[v0] FormData parsing error:", formDataError)
      return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 })
    }

    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] No file in FormData")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, file.type, file.size)

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      console.error("[v0] Invalid file type:", file.type)
      return NextResponse.json({ error: "Invalid file type. Only images are allowed." }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("[v0] File too large:", file.size)
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    console.log("[v0] Creating admin client...")
    const supabase = createAdminClient()

    console.log("[v0] Checking if storage bucket exists...")
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        console.error("[v0] Error listing buckets:", bucketsError)
        return NextResponse.json(
          {
            error: "Storage configuration error. Please ensure the storage bucket is set up correctly.",
            details: bucketsError.message,
          },
          { status: 500 },
        )
      }

      const bucketExists = buckets?.some((bucket) => bucket.id === "product-images")

      if (!bucketExists) {
        console.error("[v0] Storage bucket 'product-images' does not exist")
        return NextResponse.json(
          {
            error: "Storage bucket not found. Please run the SQL script: scripts/009_create_storage_bucket.sql",
          },
          { status: 500 },
        )
      }

      console.log("[v0] Storage bucket exists")
    } catch (bucketCheckError) {
      console.error("[v0] Bucket check error:", bucketCheckError)
      return NextResponse.json(
        {
          error: "Failed to verify storage configuration",
          details: bucketCheckError instanceof Error ? bucketCheckError.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split(".").pop()
    const fileName = `product-images/${timestamp}-${randomString}.${fileExt}`

    console.log("[v0] Generated filename:", fileName)

    console.log("[v0] Uploading to Vercel Blob...")

    // Upload to Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
    })

    console.log("[v0] Upload successful:", blob.url)

    return NextResponse.json({ url: blob.url }, { status: 200 })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to upload image: ${errorMessage}` }, { status: 500 })
  }
}
