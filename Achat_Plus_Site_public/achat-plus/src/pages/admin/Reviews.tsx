import { useListReviews, useUpdateReview, useDeleteReview } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

export default function AdminReviews() {
  const queryClient = useQueryClient()
  const { data: reviews } = useListReviews()
  const updateReview = useUpdateReview()
  const deleteReview = useDeleteReview()

  const handleApproveToggle = async (id: number, currentApproved: boolean) => {
    await updateReview.mutateAsync({ id, data: { approved: !currentApproved } })
    queryClient.invalidateQueries({ queryKey: ["/api/reviews"] })
  }

  const handleDelete = async (id: number) => {
    if (confirm("Supprimer cet avis ?")) {
      await deleteReview.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] })
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">Avis clients</h1>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews?.map(review => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={review.productName || ""}>
                    {review.productName}
                  </TableCell>
                  <TableCell>{review.authorName}</TableCell>
                  <TableCell>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm" title={review.comment || ""}>{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.approved ? "default" : "secondary"} className={review.approved ? "bg-green-100 text-green-700" : ""}>
                      {review.approved ? "Approuvé" : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={review.approved ? "text-orange-600" : "text-green-600"}
                      onClick={() => handleApproveToggle(review.id, review.approved)}
                      title={review.approved ? "Rejeter" : "Approuver"}
                    >
                      {review.approved ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(review.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!reviews || reviews.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun avis trouvé.
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
