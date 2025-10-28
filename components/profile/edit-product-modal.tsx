"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Book {
  id: string;
  title: string;
  author?: string;
  image?: string;
  createdAt: string;
  status: "active" | "inactive";
}

interface EditProductModalProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (book: Book) => void;
}

export function EditProductModal({
  book,
  open,
  onOpenChange,
  onSave,
}: EditProductModalProps) {
  const [formData, setFormData] = useState<Book>(book);

  useEffect(() => {
    setFormData(book);
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof Book, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product details and inventory. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  handleChange("price", Number.parseFloat(e.target.value))
                }
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  handleChange("stock", Number.parseInt(e.target.value))
                }
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => handleChange("image", e.target.value)}
                placeholder="https://example.com/product.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
