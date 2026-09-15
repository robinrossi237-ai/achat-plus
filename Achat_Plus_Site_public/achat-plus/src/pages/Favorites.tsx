import { Link } from "wouter"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { useShop } from "@/context/ShopContext"
import { Heart, History, ArrowRight } from "lucide-react"

export default function Favorites() {
  const { favorites, recentlyViewed } = useShop()
  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div><p className="text-sm font-medium uppercase tracking-wider text-primary">Ma sélection</p><h1 className="text-3xl font-bold text-secondary">Favoris & récents</h1></div>
          <Link href="/produits"><Button variant="outline" data-testid="link-favorites-catalog">Voir le catalogue <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
        <section className="mb-14">
          <div className="mb-5 flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /><h2 className="text-2xl font-bold">Mes favoris <span className="text-base font-normal text-muted-foreground">({favorites.length})</span></h2></div>
          {favorites.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{favorites.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState text="Vous n'avez pas encore de favoris." />}
        </section>
        <section>
          <div className="mb-5 flex items-center gap-2"><History className="h-5 w-5 text-secondary" /><h2 className="text-2xl font-bold">Récemment consultés <span className="text-base font-normal text-muted-foreground">({recentlyViewed.length})</span></h2></div>
          {recentlyViewed.length ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{recentlyViewed.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <EmptyState text="Vos produits consultés apparaîtront ici." />}
        </section>
      </div>
    </AppLayout>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-muted-foreground" data-testid="empty-personal-products">{text}</div>
}
