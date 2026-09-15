import { Switch, Route, Router as WouterRouter, useLocation } from "wouter"
import { useEffect } from "react"
import Home from "./pages/Home"
import Catalog from "./pages/Catalog"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import Favorites from "./pages/Favorites"
import CategoryPage from "./pages/CategoryPage"
import Promotions from "./pages/Promotions"
import FlashSales from "./pages/FlashSales"
import { InfoPage } from "./components/InfoPage"
import { ShopProvider } from "./context/ShopContext"

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page non trouvée</h1>
      <a href="/" className="text-primary hover:underline">Retour à l'accueil</a>
    </div>
  )
}

function ScrollToTop() {
  const [location] = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location])
  return null
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/produits" component={Catalog} />
      <Route path="/produit/:id" component={ProductDetail} />
      <Route path="/panier" component={Cart} />
      <Route path="/favoris" component={Favorites} />
      <Route path="/categorie/:slug" component={CategoryPage} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/ventes-flash" component={FlashSales} />
      <Route path="/livraison" component={() => <InfoPage slug="livraison" />} />
      <Route path="/politique-retour" component={() => <InfoPage slug="politique-retour" />} />
      <Route path="/qui-sommes-nous" component={() => <InfoPage slug="qui-sommes-nous" />} />
      
      <Route component={NotFound} />
    </Switch>
    </>
  )
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </ShopProvider>
    </QueryClientProvider>
  )
}

export default App
