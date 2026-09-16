import { useEffect, useState } from "react"
import { useGetCategoryBySlug, useListProducts } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import { Link, useParams } from "wouter"
import { ChevronRight, PackageOpen } from "lucide-react"

export default function CategoryPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const { data: category, isLoading, isError } = useGetCategoryBySlug(slug)
  const { data: productsData, isLoading: isProductsLoading } = useListProducts(
    { category: category?.name ?? "", limit: 60 },
    { query: { enabled: Boolean(category?.name), placeholderData: (prev: any) => prev } },
  )

  const products = productsData?.items || []
  const bannerImages = category?.images?.length ? category.images : (category?.imageUrl ? [category.imageUrl] : [])
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    if (bannerImages.length <= 1) { setImgIndex(0); return }
    const timer = setInterval(() => setImgIndex((i) => (i + 1) % bannerImages.length), 5000)
    return () => clearInterval(timer)
  }, [bannerImages.length])

  const currentImage = bannerImages[imgIndex]

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Chemin de navigation */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/produits" className="hover:text-primary">Catalogue</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{category?.name || "Catégorie"}</span>
        </nav>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : isError || !category ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <PackageOpen className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Catégorie introuvable</h1>
            <p className="text-muted-foreground mb-6">Cette catégorie n'existe pas ou a été retirée.</p>
            <Link href="/produits" className="font-semibold text-primary hover:underline">Voir le catalogue</Link>
          </div>
        ) : (
          <>
            {/* Bannière (image authentique, dimensions d'origine, sans recadrage) */}
            {bannerImages.length > 0 ? (
              <div className="relative mb-8 overflow-hidden rounded-2xl border bg-muted">
                <div className="grid" style={{ gridTemplateAreas: "stack" }}>
                  {bannerImages.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${category.name} ${i + 1}`}
                      style={{ gridArea: "stack", width: "100%", objectFit: "contain" }}
                      className={`h-52 w-full object-contain sm:h-60 md:h-72 transition-opacity duration-700 ${i === imgIndex ? "opacity-100" : "opacity-0"}`}
                    />
                  ))}
                </div>
                {bannerImages.length > 1 ? (
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                    {bannerImages.map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-5 bg-secondary" : "w-1.5 bg-secondary/40"}`} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mb-8 flex h-44 items-center justify-center rounded-2xl bg-secondary text-white">
                <h1 className="text-3xl font-bold">{category.name}</h1>
              </div>
            )}

            {/* Titre/description sous la bannière */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold md:text-4xl mb-3">{category.name}</h1>
              {category.description ? (
                <p className="max-w-3xl text-muted-foreground md:text-lg">{category.description}</p>
              ) : (
                <p className="max-w-3xl text-muted-foreground md:text-lg">Découvrez toute notre sélection {category.name.toLowerCase()}.</p>
              )}
              <span className="mt-3 inline-flex rounded-full bg-primary px-3 py-1 text-sm font-bold text-white">
                {productsData?.total || 0} produit{((productsData?.total || 0) > 1) ? "s" : ""}
              </span>
            </div>

            {/* Grille des produits */}
            {isProductsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center">
                <PackageOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">Aucun produit dans cette catégorie</h2>
                <p className="text-muted-foreground">Revenez bientôt, de nouveaux produits arrivent.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}