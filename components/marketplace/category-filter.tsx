"use client"

import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/marketplace"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        onClick={() => onSelectCategory(null)}
        className={selectedCategory === null ? "phoenix-gradient text-foreground" : ""}
      >
        All Products
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onSelectCategory(category.id)}
          className={selectedCategory === category.id ? "phoenix-gradient text-foreground" : ""}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
