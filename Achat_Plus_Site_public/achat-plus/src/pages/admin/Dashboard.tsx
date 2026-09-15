import { useGetDashboardStats, useGetOrdersByStatus, useGetTopProducts, useGetRecentOrders } from "@workspace/api-client-react"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ShoppingCart, DollarSign, Package, Users } from "lucide-react"

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats()
  const { data: statusData } = useGetOrdersByStatus()
  const { data: topProducts } = useGetTopProducts({ limit: 5 })
  const { data: recentOrders } = useGetRecentOrders({ limit: 5 })

  const kpis = [
    { title: "Commandes totales", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-500" },
    { title: "Chiffre d'affaires", value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: "text-green-500" },
    { title: "Produits en catalogue", value: stats?.totalProducts || 0, icon: Package, color: "text-orange-500" },
    { title: "Commandes en attente", value: stats?.pendingOrders || 0, icon: Users, color: "text-red-500" }
  ]

  const chartData = statusData?.map(item => ({
    name: item.status,
    Commandes: item.count
  })) || []

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8 text-secondary">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <Card key={i} className="border-border">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
                  <h3 className="text-2xl font-bold">{kpi.value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle>État des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="Commandes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topProducts?.map(prod => (
                <div key={prod.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                    <img src={prod.imageUrl || "https://placehold.co/100x100"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{prod.name}</p>
                    <p className="text-xs text-muted-foreground">{prod.orderCount} ventes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">{formatPrice(prod.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
