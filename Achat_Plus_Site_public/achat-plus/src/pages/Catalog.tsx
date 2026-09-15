import { useMemo, useState, useEffect } from "react"
import { useLocation, Link } from "wouter"
import { useListProducts, useListCategories } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RangeSlider } from "@/components/ui/RangeSlider"
import { Filter, X, Search, SlidersHorizontal, ChevronRight } from "lucide-react"

type SortOption = "relevance" | "price-asc" | "price-desc" | "rating" | "newest"

interface AppliedFilters {
  category: string | undefined
  minPrice: number | undefined
  maxPrice: number | undefined
  stockStatus: "available" | "low" | undefined
}

export default function Catalog() {
  const [location, setLocation] = useLocation()
  const [searchParams] = useState(() => new URLSearchParams(window.location.search))
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [sortOption, setSortOption] = useState<SortOption>("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const onPromotion = searchParams.get("flash") === "true"

  const { data: categories } = useListCategories()
  const priceProbe = useListProducts({ limit: 100 })
  const pricing = useMemo(() => {
    const items = priceProbe.data?.items || []
    const max = items.reduce((m, p) => Math.max(m, p.finalPrice ?? 0), 0)
    return { max: Math.max(max, 1) }
  }, [priceProbe.data])

  const [applied, setApplied] = useState<AppliedFilters>({
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    stockStatus: undefined,
  })
  const [draft, setDraft] = useState<AppliedFilters>(applied)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, pricing.max])
  const [priceReady, setPriceReady] = useState(false)

  useEffect(() => {
    if (priceProbe.data && !priceReady) {
      setPriceRange([0, pricing.max])
      setPriceReady(true)
    }
  }, [priceProbe.data, pricing.max, priceReady])

  const { data: productsData, isLoading } = useListProducts({
    category: applied.category,
    search: searchQuery.trim() || undefined,
    minPrice: applied.minPrice,
    maxPrice: applied.maxPrice,
    stockStatus: applied.stockStatus,
    onPromotion: onPromotion || undefined,
    limit: 40,
  })

  const products = useMemo(() => {
    const items = [...(productsData?.items || [])]
    if (sortOption === "price-asc") return items.sort((a, b) => a.finalPrice - b.finalPrice)
    if (sortOption === "price-desc") return items.sort((a, b) => b.finalPrice - a.finalPrice)
    if (sortOption === "rating") return items.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0))
    if (sortOption === "newest") return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return items
  }, [productsData?.items, sortOption])

  const suggestions = searchQuery.trim().length >= 2
    ? (productsData?.items || []).filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : []

  const applyFilters = () => {
    const [lo, hi] = priceRange
    setApplied({
      category: draft.category,
      minPrice: lo > 0 ? lo : undefined,
      maxPrice: hi < pricing.max ? hi : undefined,
      stockStatus: draft.stockStatus,
    })
    setShowFilters(false)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setSortOption("relevance")
    setDraft({ category: undefined, minPrice: undefined, maxPrice: undefined, stockStatus: undefined })
    setPriceRange([0, pricing.max])
    setApplied({ category: undefined, minPrice: undefined, maxPrice: undefined, stockStatus: undefined })
    setLocation("/produits")
  }

  const selectedCategory = categories?.find((category) => category.name === applied.category)
  const activeFilters = [
    searchQuery && { label: `Recherche : ${searchQuery}`, clear: () => setSearchQuery("") },
    selectedCategory && { label: selectedCategory.name, clear: () => setApplied((a) => ({ ...a, category: undefined })) },
    applied.minPrice !== undefined && { label: `Dès ${applied.minPrice.toLocaleString("fr-FR")} F`, clear: () => setApplied((a) => ({ ...a, minPrice: undefined })) },
    applied.maxPrice !== undefined && { label: `Jusqu'à ${applied.maxPrice.toLocaleString("fr-FR")} F`, clear: () => setApplied((a) => ({ ...a, maxPrice: undefined })) },
    applied.stockStatus && { label: applied.stockStatus === "available" ? "En stock" : "Stock faible", clear: () => setApplied((a) => ({ ...a, stockStatus: undefined })) },
    onPromotion && { label: "Ventes flash", clear: () => setLocation("/produits") },
  ].filter(Boolean) as Array<{ label: string; clear: () => void }>

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 lg:px-8">
        <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight size={14} />
          <span>Catalogue</span>
        </nav>
        <div className="mb-7 rounded-2xl bg-secondary p-6 text-white md:p-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Trouvez votre prochain coup de cœur</p>
          <h1 className="text-3xl font-bold md:text-4xl">Catalogue {onPromotion ? "des ventes flash" : "Achat+"}</h1>
          <div className="relative mt-5 max-w-2xl">
            <form onSubmit={(event) => { event.preventDefault(); setSearchFocused(false) }}>
              <Input
                data-testid="input-catalog-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Rechercher par nom ou marque..."
                className="h-12 border-0 bg-white pr-12 text-foreground"
              />
              <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1 text-primary"><Search className="h-5 w-5" /></Button>
            </form>
            {searchFocused && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-14 z-30 rounded-xl border bg-white p-2 text-foreground shadow-xl">
                {suggestions.map((product) => <button key={product.id} type="button" data-testid={`button-catalog-suggestion-${product.id}`} onMouseDown={() => { setSearchQuery(product.name); setSearchFocused(false) }} className="flex w-full items-center justify-between rounded-lg p-3 text-left text-sm hover:bg-muted"><span>{product.name}</span><span className="font-semibold text-secondary">{product.finalPrice.toLocaleString("fr-FR")} F</span></button>)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
          <h2 className="font-bold text-xl">Produits</h2>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters"><Filter className="mr-2 h-4 w-4" /> Filtres</Button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2" data-testid="container-active-filters">
            <span className="mr-1 text-sm font-medium text-muted-foreground">Filtres actifs :</span>
            {activeFilters.map((filter) => <button key={filter.label} type="button" onClick={filter.clear} data-testid={`button-clear-filter-${filter.label}`} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-orange-100">{filter.label}<X className="h-3 w-3" /></button>)}
            <button type="button" onClick={resetFilters} className="ml-1 text-xs font-medium text-muted-foreground underline">Tout effacer</button>
          </div>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className={`w-full shrink-0 lg:block lg:w-64 ${showFilters ? "block" : "hidden"}`}>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2 border-b pb-4"><SlidersHorizontal className="h-4 w-4 text-primary" /><h2 className="font-bold">Affiner les résultats</h2></div>
              <div className="space-y-6">
                <div className="space-y-3"><Label>Catégories</Label>{categories?.map((cat) => <label key={cat.id} className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="category" checked={draft.category === cat.name} onChange={() => setDraft((d) => ({ ...d, category: d.category === cat.name ? undefined : cat.name }))} className="text-primary focus:ring-primary" />{cat.name}<span className="ml-auto text-xs text-muted-foreground">{cat.productCount || ""}</span></label>)}</div>
                <div className="space-y-2">
                  <Label>Prix (FCFA)</Label>
                  <RangeSlider min={0} max={pricing.max} value={priceRange} onChange={setPriceRange} step={500} />
                </div>
                <div className="space-y-2"><Label>Disponibilité</Label><Select value={draft.stockStatus || "all"} onValueChange={(value) => setDraft((d) => ({ ...d, stockStatus: value === "all" ? undefined : value as "available" | "low" }))}><SelectTrigger data-testid="select-stock-filter"><SelectValue placeholder="Tout" /></SelectTrigger><SelectContent><SelectItem value="all">Tout</SelectItem><SelectItem value="available">En stock</SelectItem><SelectItem value="low">Stock faible</SelectItem></SelectContent></Select></div>
                <Button className="w-full" onClick={applyFilters} data-testid="button-apply-filters">Appliquer</Button>
                <Button variant="outline" className="w-full" onClick={resetFilters} data-testid="button-reset-filters">Réinitialiser</Button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="hidden font-bold text-2xl lg:block">Tous les produits</h2><span className="text-sm text-muted-foreground">{productsData?.total || 0} produit{(productsData?.total || 0) > 1 ? "s" : ""} trouvé{(productsData?.total || 0) > 1 ? "s" : ""}</span></div>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}><SelectTrigger data-testid="select-sort-products" className="w-52"><SelectValue placeholder="Trier par" /></SelectTrigger><SelectContent><SelectItem value="relevance">Pertinence</SelectItem><SelectItem value="price-asc">Prix croissant</SelectItem><SelectItem value="price-desc">Prix décroissant</SelectItem><SelectItem value="rating">Meilleures notes</SelectItem><SelectItem value="newest">Nouveautés</SelectItem></SelectContent></Select>
            </div>
            {isLoading ? <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">{[...Array(9)].map((_, index) => <div key={index} className="h-80 animate-pulse rounded-xl border bg-white" />)}</div>
              : products.length === 0 ? <div className="rounded-xl border bg-white p-12 text-center"><h3 className="mb-2 text-xl font-medium">Aucun produit trouvé</h3><p className="text-muted-foreground">Essayez de modifier votre recherche ou vos filtres.</p><Button variant="outline" className="mt-6" onClick={resetFilters}>Réinitialiser les filtres</Button></div>
              : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
          </main>
        </div>
      </div>
    </AppLayout>
  )
}
