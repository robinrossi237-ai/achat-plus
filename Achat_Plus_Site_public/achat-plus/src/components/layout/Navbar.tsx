import * as React from "react"
import { Link, useLocation } from "wouter"
import { useListProducts, getListProductsQueryKey, useListCategories } from "@workspace/api-client-react"
import { Search, ShoppingBag, Menu, Heart, X } from "lucide-react"
import logoPath from "@assets/Achat Plus Logo.png"
import achatIcon from "@assets/Achat.png"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useShop } from "@/context/ShopContext"

export function Navbar() {
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchFocused, setSearchFocused] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const { cartCount, favorites } = useShop()
  const { data: categories } = useListCategories()
  const suggestionParams = searchQuery.trim().length >= 2 ? { search: searchQuery.trim(), limit: 5 } : undefined
  const { data: suggestions } = useListProducts(suggestionParams, {
    query: { enabled: Boolean(suggestionParams), queryKey: getListProductsQueryKey(suggestionParams) },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setLocation(`/produits?search=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  const go = (to: string) => {
    setMobileMenuOpen(false)
    setLocation(to)
  }

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-3 md:px-4 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-1.5 md:gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 md:h-9 md:w-9" onClick={() => setMobileMenuOpen(true)} aria-label="Ouvrir le menu" data-testid="button-open-mobile-menu">
              <Menu className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img src={logoPath} alt="Achat+ Logo" className="h-8 md:h-9 w-auto object-contain" />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <Input 
              data-testid="input-navbar-search"
              placeholder="Chercher un produit, une marque..." 
              className="w-full pr-10 rounded-full bg-muted border-transparent focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 rounded-r-full text-muted-foreground hover:text-primary">
              <Search className="h-5 w-5" />
            </Button>
            {searchFocused && suggestions?.items?.length ? (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border bg-white p-2 shadow-xl">
                {suggestions.items.map((product) => (
                  <Link key={product.id} href={`/produit/${product.id}`} onClick={() => { setSearchQuery(""); setSearchFocused(false); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid={`link-search-suggestion-${product.id}`} className="flex items-center gap-3 rounded-lg p-2 text-sm hover:bg-muted">
                    <img src={product.images?.[0] || logoPath} alt="" className="h-10 w-10 rounded-md object-cover" />
                    <span className="min-w-0 flex-1 truncate">{product.name}</span>
                    <span className="font-semibold text-secondary">{new Intl.NumberFormat("fr-FR").format(product.finalPrice)} F</span>
                  </Link>
                ))}
                <button type="submit" data-testid="button-see-search-results" className="w-full border-t p-2 text-left text-xs font-semibold text-primary">Voir tous les résultats</button>
              </div>
            ) : null}
          </form>

          <div className="flex items-center gap-1.5 sm:gap-4">
            <Link href="/favoris" className="relative hidden sm:block" data-testid="link-favorites">
              <Button variant="ghost" size="icon" aria-label="Mes favoris" title="Mes favoris"><Heart className="h-5 w-5" /></Button>
              {favorites.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{favorites.length}</span>}
            </Link>
            <Link href="/panier" className="relative" data-testid="link-cart">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10" aria-label="Mon panier" title="Mon panier"><ShoppingBag className="h-5 w-5" /></Button>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{cartCount}</span>}
            </Link>
          </div>
        </div>

        {/* Mobile search — full width below the logo row */}
        <form onSubmit={handleSearch} className="flex pb-2.5 md:hidden relative">
          <Input
            data-testid="input-mobile-search"
            placeholder="Rechercher un produit, une marque..."
            className="h-10 w-full pr-10 rounded-full bg-muted border-transparent focus-visible:bg-white text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)}
          />
          <Button type="submit" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-muted-foreground">
            <Search className="h-4 w-4" />
          </Button>
          {searchFocused && suggestions?.items?.length ? (
            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border bg-white p-1 shadow-xl">
              {suggestions.items.slice(0, 4).map((product) => (
                <Link key={product.id} href={`/produit/${product.id}`} onClick={() => { setSearchQuery(""); setSearchFocused(false); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 rounded-lg p-2 text-xs hover:bg-muted">
                  <img src={product.images?.[0] || logoPath} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </form>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileMenuOpen(false)} />
        <aside className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white shadow-xl transition-transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`} data-testid="drawer-mobile-menu">
          <div className="flex items-center justify-between border-b border-border p-4">
            <span className="flex items-center gap-2 text-lg font-bold">
              <img src={achatIcon} alt="" className="h-8 w-8 rounded-full object-contain" />
              Menu
            </span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer le menu"><X className="h-5 w-5" /></Button>
          </div>

          <div className="p-4">
            <button onClick={() => go("/")} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium hover:bg-muted">Accueil</button>
            <button onClick={() => go("/produits")} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left font-medium hover:bg-muted">Catalogue de produits</button>

            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catégories</p>
            {(categories || []).map((cat) => (
              <button
                key={cat.id}
                onClick={() => go(`/categorie/${cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {cat.name}
                <span className="text-xs text-muted-foreground/60">{cat.productCount || ""}</span>
              </button>
            ))}

            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mes comptes</p>
            <button onClick={() => go("/favoris")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium hover:bg-muted"><Heart className="h-4 w-4 text-primary" /> Favoris{favorites.length > 0 ? ` (${favorites.length})` : ""}</button>
            <button onClick={() => go("/panier")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium hover:bg-muted"><ShoppingBag className="h-4 w-4 text-primary" /> Panier{cartCount > 0 ? ` (${cartCount})` : ""}</button>

            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations</p>
            <button onClick={() => go("/livraison")} className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Livraison</button>
            <button onClick={() => go("/politique-retour")} className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Politique de retour</button>
            <button onClick={() => go("/qui-sommes-nous")} className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Qui sommes-nous ?</button>
          </div>
        </aside>
      </div>
    </nav>
  )
}
