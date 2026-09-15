import { useListPromotions, useDeletePromotion, useUpdatePromotion } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Switch } from "@/components/ui/switch"

export default function AdminPromotions() {
  const queryClient = useQueryClient()
  const { data: promotions } = useListPromotions()
  const updatePromotion = useUpdatePromotion()
  const deletePromotion = useDeletePromotion()

  const handleToggle = async (id: number, currentActive: boolean) => {
    await updatePromotion.mutateAsync({ id, data: { active: !currentActive } })
    queryClient.invalidateQueries({ queryKey: ["/api/promotions"] })
  }

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cette promotion ?")) {
      await deletePromotion.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] })
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Promotions</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle promo
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réduction</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions?.map(promo => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{promo.type}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-destructive">
                    {promo.discountPercent ? `-${promo.discountPercent}%` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {promo.startsAt ? new Date(promo.startsAt).toLocaleDateString('fr-FR') : '...'} au {promo.endsAt ? new Date(promo.endsAt).toLocaleDateString('fr-FR') : '...'}
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={promo.active} 
                      onCheckedChange={() => handleToggle(promo.id, promo.active)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="text-blue-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(promo.id)}>
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
