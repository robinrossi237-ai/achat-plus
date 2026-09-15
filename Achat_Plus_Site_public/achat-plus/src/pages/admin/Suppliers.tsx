import { useListSuppliers, useDeleteSupplier } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export default function AdminSuppliers() {
  const queryClient = useQueryClient()
  const { data: suppliers } = useListSuppliers()
  const deleteSupplier = useDeleteSupplier()

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer ce fournisseur ?")) {
      await deleteSupplier.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] })
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Fournisseurs</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau fournisseur
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.phone || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{supplier.address || "-"}</TableCell>
                  <TableCell>{supplier.productCount || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="text-blue-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(supplier.id)}>
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
