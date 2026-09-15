import { useState } from "react"
import { useListProducts, useDeleteProduct, useListCategories } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  
  const { data: productsData } = useListProducts({ search, limit: 100 })
  const deleteProduct = useDeleteProduct()

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      await deleteProduct.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ["/api/products"] })
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Produits</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau produit
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix Achat</TableHead>
                <TableHead>Prix Final</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData?.items.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                        <img src={product.images?.[0] || "https://placehold.co/100x100"} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="line-clamp-1">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.categoryName}</TableCell>
                  <TableCell>{formatPrice(product.supplierPrice)}</TableCell>
                  <TableCell className="font-bold text-primary">{formatPrice(product.finalPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={product.stockStatus === 'available' ? 'default' : product.stockStatus === 'low' ? 'secondary' : 'destructive'} 
                          className={product.stockStatus === 'available' ? 'bg-green-100 text-green-700' : ''}>
                      {product.stockStatus === 'available' ? 'En stock' : product.stockStatus === 'low' ? 'Faible' : 'Rupture'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!productsData || productsData.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun produit trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}
