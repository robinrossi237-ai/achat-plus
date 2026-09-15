import { useListCategories, useListPromotions, useGetSettings, useListHomeSections, useListProducts, useListFlashSaleProducts } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ArrowRight, Truck, ShieldCheck, Clock, CheckCircle2, ShoppingCart } from "lucide-react"
import { Link } from "wouter"
import { ProductCard } from "@/components/ProductCard"
import { CarouselItem } from "@/components/ui/carousel"
import { AutoplayCarousel } from "@/components/ui/AutoplayCarousel"
import CountdownTimer from "@/components/CountdownTimer"
import { HeroSlider } from "@/components/HeroSlider"
import { AnnouncementsBar } from "@/components/layout/AnnouncementsBar"
import type { Product } from "@workspace/api-client-react"

import heroBg from "@assets/generated_images/hero-orange-bg.png"
import sectionLogo from "@assets/Achat.png"

const slideClassName = "basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6"

export default function Home() {
  const { data: categories } = useListCategories()
  const { data: promotions } = useListPromotions()
  const { data: homeSections } = useListHomeSections({ limit: 10 })
  const { data: settings } = useGetSettings()
  const { data: allProductsData } = useListProducts({ limit: 200 })
  const { data: flashSaleProducts } = useListFlashSaleProducts(10)

  const storeName = settings?.storeName || "Achat+"
  const topSold = homeSections?.topSold ?? []
  const topViewed = homeSections?.topViewed ?? []
  const soldVisible = homeSections?.soldVisible ?? false
  const popularVisible = homeSections?.popularVisible ?? false
  const promotedProducts = (() => {
    const all = (allProductsData?.items ?? []) as Product[]
    const seen = new Set<number>()
    const out: Product[] = []
    const push = (p?: Product | null) => {
      if (!p || seen.has(p.id)) return
      seen.add(p.id)
      out.push(p)
    }
    for (const promo of (promotions || [])) {
      const pp: any = promo
      if (pp.product) push(pp.product as Product)
      if (pp.categoryName) {
        for (const p of all) {
          if (p.category === pp.categoryName) push(p)
        }
      }
    }
    return out.filter((p: any) => p.stockStatus !== "out").slice(0, 10)
  })()

  const promoEndDate = (() => {
    const now = Date.now()
    let closest: string | null = null
    let closestMs = Infinity
    for (const promo of (promotions || [])) {
      const ed = (promo as any).endDate
      if (!ed) continue
      const ms = new Date(`${ed}T23:59:59`).getTime()
      if (ms > now && ms < closestMs) {
        closestMs = ms
        closest = ed
      }
    }
    return closest
  })()

  const allProducts = (allProductsData?.items ?? []) as Product[]

  const groupedByCategory = (() => {
    const map = new Map<string, Product[]>()
    for (const p of allProducts) {
      if (p.status !== "available" || p.stock === 0) continue
      const cat = p.category || "Autre"
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
  })()

  return (
    <AppLayout>
      <AnnouncementsBar />
      <section className="relative overflow-hidden bg-secondary">
        <HeroSlider settings={settings} heroBg={heroBg} />
      </section>

      {/* Categories */}
      <section className="py-6 -mt-20 relative z-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-5 md:p-7 border border-border">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <img src={sectionLogo} alt="" className="w-4 h-4 object-contain" />
                </span>
                <h2 className="text-lg md:text-xl font-bold text-secondary">Catégories</h2>
              </div>
              <Link href="/produits" className="text-sm font-medium text-primary hover:underline flex items-center">
                Tout voir <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <AutoplayCarousel
              className="w-full"
              contentClassName="-ml-4"
              autoplay
              autoplayInterval={3500}
              loop
              showDots
              arrowClassName="z-20"
            >
              {(categories || []).map((cat) => (
                <CarouselItem key={cat.id} className={`${slideClassName} pl-4`}>
                  <Link href={`/categorie/${cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`} className="group block">
                    <div className="bg-muted rounded-xl p-4 text-center transition-transform hover:-translate-y-1 hover:shadow-md h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-sm text-secondary group-hover:text-primary text-center line-clamp-2">{cat.name}</span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </AutoplayCarousel>
          </div>
        </div>
      </section>

      {/* Promotions */}
      {promotedProducts.length > 0 && (
        <section className="py-6">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <img src={sectionLogo} alt="" className="w-4 h-4 object-contain" />
                </span>
                <h2 className="text-lg md:text-xl font-bold text-secondary">Promotions en cours</h2>
                <span className="hidden sm:inline"><CountdownTimer endDate={promoEndDate} /></span>
              </div>
              <Link href="/promotions" className="text-sm font-medium text-primary hover:underline flex items-center shrink-0">
                Tout voir <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <AutoplayCarousel className="w-full" contentClassName="-ml-6" autoplay autoplayInterval={3600} loop showDots>
                {promotedProducts.map((product: any) => (
                  <CarouselItem key={product.id} className={`${slideClassName} pl-6`}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </AutoplayCarousel>
            </div>
          </div>
        </section>
      )}

      {/* VENTE FLASH */}
      {flashSaleProducts && flashSaleProducts.length > 0 && (
        <section className="py-6 bg-white border-t border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="rounded-xl overflow-hidden border border-primary/20 bg-primary mb-4">
              <div className="flex flex-wrap justify-between items-center gap-3 p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-white text-primary text-sm font-bold uppercase tracking-wide">Vente Flash</span>
                  {promoEndDate && (
                    <span className="hidden sm:inline"><CountdownTimer endDate={promoEndDate} /></span>
                  )}
                </div>
                <Link href="/ventes-flash" className="text-sm font-bold text-white hover:text-white/80 flex items-center shrink-0">
                  Voir tout <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <AutoplayCarousel className="w-full" contentClassName="-ml-6" autoplay autoplayInterval={3200} loop showDots>
                {flashSaleProducts.map((product) => (
                  <CarouselItem key={product.id} className={`${slideClassName} pl-6`}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </AutoplayCarousel>
            </div>
          </div>
        </section>
      )}

      {/* Les produits les plus vendus */}
      {soldVisible && topSold.length > 0 && (
        <section className="py-6 bg-white border-t border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <img src={sectionLogo} alt="" className="w-4 h-4 object-contain" />
                </span>
                <h2 className="text-lg md:text-xl font-bold text-secondary">Les produits les plus vendus</h2>
              </div>
              <Link href="/produits" className="text-sm font-medium text-primary hover:underline flex items-center">
                Catalogue <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <AutoplayCarousel className="w-full" contentClassName="-ml-6" autoplay autoplayInterval={4000} loop showDots>
                {topSold.map((product) => (
                  <CarouselItem key={product.id} className={`${slideClassName} pl-6`}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </AutoplayCarousel>
            </div>
          </div>
        </section>
      )}

      {/* Les produits les plus populaires */}
      {popularVisible && topViewed.length > 0 && (
        <section className="py-6 bg-[#f8f6f3] border-t border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <img src={sectionLogo} alt="" className="w-4 h-4 object-contain" />
                </span>
                <h2 className="text-lg md:text-xl font-bold text-secondary">Les produits les plus populaires</h2>
              </div>
              <Link href="/produits" className="text-sm font-medium text-primary hover:underline flex items-center">
                Catalogue <ArrowRight className="ml-1 w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <AutoplayCarousel className="w-full" contentClassName="-ml-6" autoplay autoplayInterval={3800} loop showDots>
                {topViewed.map((product) => (
                  <CarouselItem key={product.id} className={`${slideClassName} pl-6`}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </AutoplayCarousel>
            </div>
          </div>
        </section>
      )}

      {/* Produits par catégorie — TOUJOURS AFFICHÉ */}
      {groupedByCategory.map(([catName, products]) => (
        <section key={catName} className="py-6 border-t border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <img src={sectionLogo} alt="" className="w-4 h-4 object-contain" />
                </span>
                <h2 className="text-sm md:text-base font-bold text-secondary">{catName}</h2>
                <span className="text-xs text-muted-foreground">({products.length})</span>
              </div>
              <Link
                href={`/categorie/${catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                className="text-xs font-medium text-primary hover:underline flex items-center"
              >
                Tout voir <ArrowRight className="ml-1 w-3 h-3" />
              </Link>
            </div>
            <div className="relative">
              <AutoplayCarousel className="w-full" contentClassName="-ml-6" autoplay autoplayInterval={3500 + Math.random() * 500} loop showDots>
                {products.map((product) => (
                  <CarouselItem key={product.id} className={`${slideClassName} pl-6`}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </AutoplayCarousel>
            </div>
          </div>
        </section>
      ))}

      {/* Trust */}
      <section className="py-10 bg-white border-t border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center mb-8">
            <span className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <img src={sectionLogo} alt="" className="w-8 h-8 object-contain" />
            </span>
            <h2 className="text-3xl font-bold text-center text-secondary">Pourquoi choisir {storeName} ?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 text-primary rounded-2xl flex items-center justify-center mb-4">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Livraison Rapide</h3>
              <p className="text-muted-foreground text-sm">Recevez vos commandes en un temps record partout au Cameroun.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 text-secondary rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Paiement Sécurisé</h3>
              <p className="text-muted-foreground text-sm">Payez à la livraison ou via nos moyens de paiement sécurisés.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Qualité Garantie</h3>
              <p className="text-muted-foreground text-sm">Tous nos produits sont vérifiés et certifiés authentiques.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">Support 7j/7</h3>
              <p className="text-muted-foreground text-sm">Notre équipe est là pour vous assister à tout moment.</p>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}