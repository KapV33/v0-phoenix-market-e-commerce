import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Running database migrations...")
    const supabase = createAdminClient()

    // Check if parent_category_id column exists
    const { data: columns, error: checkError } = await supabase
      .rpc("check_column_exists", {
        table_name: "categories",
        column_name: "parent_category_id",
      })
      .single()

    if (checkError) {
      console.log("[v0] Column check failed, assuming column does not exist")
    }

    // Add parent_category_id column if it doesn't exist
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `
        -- Add parent_category_id to categories table for subcategories
        ALTER TABLE public.categories 
        ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

        -- Create index for faster parent category lookups
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_category_id);

        -- Add a check to prevent circular references (category can't be its own parent)
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'categories_no_self_reference'
          ) THEN
            ALTER TABLE public.categories 
            ADD CONSTRAINT categories_no_self_reference CHECK (id != parent_category_id);
          END IF;
        END $$;
      `,
    })

    if (alterError) {
      console.error("[v0] Migration error:", alterError)
      return NextResponse.json({ success: false, error: alterError.message }, { status: 500 })
    }

    console.log("[v0] Migrations completed successfully")
    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
    })
  } catch (error: any) {
    console.error("[v0] Migration error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
