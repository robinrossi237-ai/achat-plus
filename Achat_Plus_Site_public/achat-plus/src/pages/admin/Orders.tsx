import { useListOrders, useUpdateOrder } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import type { OrderPatchStatus } from "@workspace/api-client-react"

const statusLabels: Record<string, string> = {
  new: "Nouvelle",
  contacted: "Contacté",
  reserved: "Réservé",
  retrieved: "Récupéré",
  delivering: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  reserved: "bg-orange-100 text-orange-800",
  retrieved: "bg-indigo-100 text-indigo-800",
  delivering: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const { data: orders } = useListOrders({ limit: 100 })
  const updateOrder = useUpdateOrder()

  const handleStatusChange = async (id: number, status: OrderPatchStatus) => {
    await updateOrder.mutateAsync({ id, data: { status } })
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] })
  }

  const openWhatsApp = (phone: string, msg: string | null | undefined) => {
    const defaultMsg = "Bonjour, nous vous contactons concernant votre commande sur Achat+."
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg || defaultMsg)}`, "_blank")
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Commandes</h1>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1">{order.productName}</p>
                    <p className="text-xs text-muted-foreground">Qté: {order.quantity}</p>
                  </TableCell>
                  <TableCell className="font-bold">{formatPrice(order.totalPrice)}</TableCell>
                  <TableCell>
                    <Select defaultValue={order.status} onValueChange={(v) => handleStatusChange(order.id, v as OrderPatchStatus)}>
                      <SelectTrigger className={`h-8 w-32 border-none ${statusColors[order.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <button 
                      onClick={() => openWhatsApp(order.customerPhone, order.whatsappMessage)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {(!orders || orders.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune commande trouvée.
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
