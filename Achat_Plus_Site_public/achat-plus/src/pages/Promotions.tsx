import { useMemo } from "react"
import { Link } from "wouter"
import { useListPromotions, useListProducts } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import CountdownTimer from "@/components/CountdownTimer"
import { CarouselItem } from "@/components/ui/carousel"
import { AutoplayCarousel } from "@/components/ui/AutoplayCarousel"
import { Megaphone, ChevronRight } from "lucide-react"
import type { Product } from "@workspace/api-client-react"

const slideClassName = "basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"

interface PromoWithTime {
  product?: Product | null
  categoryName?: string | null
  name: string
  discountPercent: number
  endDate?: string | null
}

export default function Promotions() {
  const { data: promotions } = useListPromotions()
  const { data: allProductsData } = useListProducts({ limit: 200 })
  const allProducts = (allProductsData?.items ?? []) as Product[]

  const promos = (promotions || []) as PromoWithTime[]

  const fireLane = useMemo(() => {
    const seen = new Set<number>()
    const byProduct = new Map<number, PromoWithTime>()
    const byCategory = new Map<string, PromoWithTime>()
    const out: { product: Product; promo: PromoWithTime }[] = []

    const register = (product: Product, promo: PromoWithTime) => {
      let p: PromoWithTime | undefined = byProduct.get(product.id)
      if (!p) {
        byProduct.set(product.id, promo)
        p = promo
      }
      if (!seen.has(product.id)) {
        seen.add(product.id)
        out.push({ product, promo: p })
      }
    }

    for (const promo of promos) {
      if (promo.product) {
        register(promo.product, promo)
        continue
      }
      if (promo.categoryName) {
        byCategory.set(promo.categoryName, promo)
        for (const p of allProducts) {
          if (p.category === promo.categoryName) register(p, promo)
        }
      }
    }

    const groupedByCategory = new Map<string, typeof out>()
    for (const item of out) {
      const cat = item.product.category || "Autre"
      if (!groupedByCategory.has(cat)) groupedByCategory.set(cat, [])
      groupedByCategory.get(cat)!.push(item)
    }

    return Array.from(groupedByCategory.entries())
      .map(([cat, items]) => ({
        category: cat,
        items,
        endDate: byCategory.get(cat)?.endDate || (items[0] && byProduct.get(items[0].product.id)?.endDate) || null,
        discountPercent: byCategory.get(cat)?.discountPercent ?? (items[0] && byProduct.get(items[0].product.id)?.discountPercent) ?? 0,
        promoName: byCategory.get(cat)?.name || (items[0] && byProduct.get(items[0].product.id)?.name) || "",
      }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [promos, allProducts])

  const totalProducts = fireLane.reduce((acc, g) => acc + g.items.length, 0)

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <div className="mb-7 rounded-2xl bg-secondary p-6 text-white md:p-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Offres en cours</p>
          <h1 className="text-3xl font-bold md:text-4xl">Promotions</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Retrouvez ici toutes les promotions disponibles, groupées par catégorie, avec le temps restant pour chacune.
          </p>
        </div>

        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight size={14} />
          <span>Promotions</span>
          <span className="ml-auto">{totalProducts} produit{totalProducts > 1 ? "s" : ""} en promotion</span>
        </nav>

        {fireLane.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Megaphone className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-medium">Aucune promotion en cours</h3>
            <p className="text-muted-foreground">Revenez bientôt pour découvrir nos offres !</p>
          </div>
        ) : (
          <div className="space-y-12">
            {fireLane.map((group) => (
              <section key={group.category}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Megaphone className="h-5 w-5" />
                    </span>
                    <h2 className="text-sm font-bold text-secondary md:text-base">{group.category}</h2>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{group.items.length}</span>
                  </div>
                  <CountdownTimer endDate={group.endDate} />
                </div>
                {group.promoName && (
                  <p className="mb-4 -mt-2 text-sm text-muted-foreground">
                    Promotion : <span className="font-semibold text-primary">-{group.discountPercent}%</span> — {group.promoName}
                  </p>
                )}
                <div className="relative">
                  <AutoplayCarousel
                    className="w-full"
                    contentClassName="-ml-6"
                    autoplay
                    autoplayInterval={3600}
                    loop
                    showDots
                  >
                    {group.items.map((item) => (
                      <CarouselItem key={item.product.id} className={`${slideClassName} pl-6`}>
                        <ProductCard product={item.product} />
                      </CarouselItem>
                    ))}
                  </AutoplayCarousel>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
