// Admin utilities for Phoenix Market
import { createAdminClient } from "@/lib/supabase/admin"

export interface ProductFormData {
  name: string
  slug: string
  description: string
  price: number
  categoryId: string | null
  imageUrl: string
  stockQuantity: number
  deliveryContent: string
  isActive: boolean
}

export interface CategoryFormData {
  name: string
  slug: string
  description: string
  imageUrl: string
  parentCategoryId?: string | null // Added parentCategoryId field
}

// Create product
export async function createProduct(data: ProductFormData) {
  const supabase = createAdminClient()

  let categoryId = data.categoryId
  if (categoryId === "default" || categoryId === "" || categoryId === "null") {
    categoryId = null
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category_id: categoryId,
      image_url: data.imageUrl,
      stock_quantity: data.stockQuantity,
      delivery_content: data.deliveryContent,
      is_active: data.isActive,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Create product error:", error)
    throw new Error(error.message)
  }

  return product
}

// Update product
export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.description !== undefined) updateData.description = data.description
  if (data.price !== undefined) updateData.price = data.price
  if (data.categoryId !== undefined) {
    let categoryId = data.categoryId
    if (categoryId === "default" || categoryId === "" || categoryId === "null") {
      categoryId = null
    }
    updateData.category_id = categoryId
  }
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
  if (data.stockQuantity !== undefined) updateData.stock_quantity = data.stockQuantity
  if (data.deliveryContent !== undefined) updateData.delivery_content = data.deliveryContent
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { data: product, error } = await supabase.from("products").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Update product error:", error)
    throw new Error(error.message)
  }

  return product
}

// Delete product
export async function deleteProduct(id: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error("[v0] Delete product error:", error)
    throw new Error(error.message)
  }
}

// Create category
export async function createCategory(data: CategoryFormData) {
  const supabase = createAdminClient()

  let parentCategoryId = data.parentCategoryId
  if (parentCategoryId === "none" || !parentCategoryId) {
    parentCategoryId = null
  }

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_url: data.imageUrl,
      parent_category_id: parentCategoryId,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Create category error:", error)
    throw new Error(error.message)
  }

  return category
}

// Update category
export async function updateCategory(id: string, data: Partial<CategoryFormData>) {
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.slug !== undefined) updateData.slug = data.slug
  if (data.description !== undefined) updateData.description = data.description
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl
  if (data.parentCategoryId !== undefined) {
    let parentCategoryId = data.parentCategoryId
    if (parentCategoryId === "none" || !parentCategoryId) {
      parentCategoryId = null
    }
    updateData.parent_category_id = parentCategoryId
  }

  const { data: category, error } = await supabase.from("categories").update(updateData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Update category error:", error)
    throw new Error(error.message)
  }

  return category
}

// Delete category
export async function deleteCategory(id: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error("[v0] Delete category error:", error)
    throw new Error(error.message)
  }
}

// Get all products (including inactive)
export async function getAllProducts() {
  const supabase = createAdminClient()

  console.log("[v0] Fetching all products...")
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Get all products error:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Products fetched successfully:", data?.length || 0)
  return data || []
}

// Get all categories
export async function getAllCategories() {
  const supabase = createAdminClient()

  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) {
    console.error("[v0] Get all categories error:", error)
    throw new Error(error.message)
  }

  return data || []
}

export async function upsertProduct(data: ProductFormData) {
  const supabase = createAdminClient()

  let categoryId = data.categoryId
  if (categoryId === "default" || categoryId === "" || categoryId === "null") {
    categoryId = null
  }

  // Check if product with this slug already exists
  const { data: existingProduct } = await supabase.from("products").select("id").eq("slug", data.slug).maybeSingle()

  const productData = {
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: data.price,
    category_id: categoryId,
    image_url: data.imageUrl,
    stock_quantity: data.stockQuantity,
    delivery_content: data.deliveryContent,
    is_active: data.isActive,
  }

  if (existingProduct) {
    // Update existing product
    const { data: product, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", existingProduct.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Update product error:", error)
      throw new Error(error.message)
    }

    return { product, updated: true }
  } else {
    // Insert new product
    const { data: product, error } = await supabase.from("products").insert(productData).select().single()

    if (error) {
      console.error("[v0] Create product error:", error)
      throw new Error(error.message)
    }

    return { product, updated: false }
  }
}
