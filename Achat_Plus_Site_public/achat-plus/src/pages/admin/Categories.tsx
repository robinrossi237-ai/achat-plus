import { useListCategories, useDeleteCategory } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export default function AdminCategories() {
  const queryClient = useQueryClient()
  const { data: categories } = useListCategories()
  const deleteCategory = useDeleteCategory()

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cette catégorie ?")) {
      await deleteCategory.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] })
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Catégories</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Marge par défaut</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell>{cat.marginPercent}%</TableCell>
                  <TableCell>{cat.productCount || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
