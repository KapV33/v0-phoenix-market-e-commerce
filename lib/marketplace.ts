// Marketplace utilities for Phoenix Market
import { createClient } from "@/lib/supabase/server"

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  stock_quantity: number
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

// Get all active categories
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data || []
}

// Get all active products
export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data || []
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products by category:", error)
    return []
  }

  return data || []
}

// Get single product by slug
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).eq("is_active", true).single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return data
}

// Get user ID from cookie
export function getUserIdFromCookie(cookieString: string): string | null {
  const match = cookieString.match(/phoenix_user_id=([^;]+)/)
  return match ? match[1] : null
}
