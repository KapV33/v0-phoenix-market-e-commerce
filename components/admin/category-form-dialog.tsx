"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit } from "lucide-react"
import type { Category } from "@/lib/marketplace"

interface CategoryFormDialogProps {
  category?: Category
  categories?: Category[]
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function CategoryFormDialog({ category, categories = [], onSuccess, trigger }: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    parentCategoryId: "none",
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.image_url || "",
        parentCategoryId: category.parent_category_id || "none",
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = category ? `/api/admin/categories/${category.id}` : "/api/admin/categories"
      const method = category ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save category")
      }

      setOpen(false)
      onSuccess()
      if (!category) {
        setFormData({ name: "", slug: "", description: "", imageUrl: "", parentCategoryId: "none" })
      }
    } catch (error) {
      alert("Failed to save category")
    } finally {
      setIsLoading(false)
    }
  }

  const availableParentCategories = categories.filter((cat) => {
    if (category && cat.id === category.id) return false
    if (category && cat.parent_category_id === category.id) return false
    return true
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="phoenix-gradient text-white">
            {category ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {category ? "Edit Category" : "Add Category"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white">{category ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Category Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentCategory" className="text-white">
              Parent Category (Optional)
            </Label>
            <Select
              value={formData.parentCategoryId}
              onValueChange={(value) => setFormData({ ...formData, parentCategoryId: value })}
            >
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="None (Top-level category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-level category)</SelectItem>
                {availableParentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-white/60">Select a parent to create a subcategory</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white">
              Slug
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              required
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-input border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-white">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1 phoenix-gradient text-white" disabled={isLoading}>
              {isLoading ? "Saving..." : category ? "Update Category" : "Create Category"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-white bg-transparent"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
