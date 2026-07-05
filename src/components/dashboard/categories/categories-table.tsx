"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryDialog } from "./category-dialog";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Search,
  FolderTree,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";

type CategoryWithRelations = Category & {
  parent: Category | null;
  children: Category[];
  _count: { products: number };
};

interface CategoriesTableProps {
  categories: CategoryWithRelations[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const parentCategories = categories.filter((c) => !c.parentId);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteCategory) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/categories/${deleteCategory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Category deleted", {
        description: `${deleteCategory.name} has been deleted`,
      });
      router.refresh();
    } catch (error) {
      toast.error("Error", { 
        description: error instanceof Error ? error.message : "Could not delete" 
      });
    } finally {
      setIsDeleting(false);
      setDeleteCategory(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredCategories.length} categories
        </Badge>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead className="text-center">Subcategories</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <FolderTree className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No categories found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderTree className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {category.parent ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {category.parent.name}
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-medium text-foreground">
                          {category.name}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline">Root</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {category.children.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {category._count.products}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditCategory(category)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteCategory(category)}
                          className="text-destructive"
                          disabled={category._count.products > 0 || category.children.length > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editCategory && (
        <CategoryDialog
          open={!!editCategory}
          onOpenChange={() => setEditCategory(null)}
          parentCategories={parentCategories}
          category={editCategory}
        />
      )}

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The category &quot;{deleteCategory?.name}&quot;
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
