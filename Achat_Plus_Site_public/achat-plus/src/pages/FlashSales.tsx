import { useListFlashSaleProducts } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import { Link } from "wouter"
import { ChevronRight, Flame, PackageOpen } from "lucide-react"

export default function FlashSales() {
  const { data: products, isLoading } = useListFlashSaleProducts(100)

  const groups: { category: string; products: typeof products }[] = []
  if (products) {
    const map = new Map<string, typeof products>()
    for (const p of products) {
      const key = p.categoryName || "Autres"
      const arr = map.get(key) || []
      arr.push(p)
      map.set(key, arr)
    }
    for (const [category, items] of map) groups.push({ category, products: items })
  }

  return (
    <AppLayout>
      <div className="bg-muted/30 py-4 border-b">
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Ventes flash</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-10 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <Flame className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Ventes flash</h1>
            <p className="text-muted-foreground mt-1">Toutes nos offres flash, rangées par catégorie.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageOpen className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Aucune vente flash en cours</h2>
            <p className="text-muted-foreground mb-6">Il n'y a pas d'offres flash pour le moment. Revenez bientôt !</p>
            <Link href="/produits" className="font-semibold text-primary hover:underline">Voir le catalogue</Link>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.category}>
                <div className="mb-5 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-secondary">{group.category}</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{group.products.length}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {group.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
