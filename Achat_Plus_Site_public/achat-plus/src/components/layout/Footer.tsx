import { Link } from "wouter"
import achatLogo from "@assets/Achat.png"
import { useGetSettings } from "@workspace/api-client-react"

export function Footer() {
  const { data: settings } = useGetSettings()
  const storeName = settings?.storeName || "Achat+"
  const whatsapp = settings?.whatsapp || "+237 61 23 45 678"

  return (
    <footer className="bg-secondary text-white py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <img src={achatLogo} alt={`${storeName} Logo`} className="h-14 w-auto object-contain" />
            <p className="text-gray-300 text-sm">
              {settings?.description || "Tout ce qu'il vous faut, à portée de clic. Votre marché de confiance en ligne."}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Liens utiles</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/" className="hover:text-primary transition-colors">Accueil</Link></li>
              <li><Link href="/produits" className="hover:text-primary transition-colors">Catalogue de produits</Link></li>
              <li><Link href="/promotions" className="hover:text-primary transition-colors">Promotions</Link></li>
              <li><Link href="/ventes-flash" className="hover:text-primary transition-colors">Ventes flash</Link></li>
              <li><Link href="/favoris" className="hover:text-primary transition-colors">Mes favoris</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Service client</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/panier" className="hover:text-primary transition-colors">Mon panier</Link></li>
              <li><Link href="/livraison" className="hover:text-primary transition-colors">Livraison</Link></li>
              <li><Link href="/politique-retour" className="hover:text-primary transition-colors">Politique de retour</Link></li>
              <li><Link href="/qui-sommes-nous" className="hover:text-primary transition-colors">Qui sommes-nous ?</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 text-white">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>{storeName}</li>
              <li>{whatsapp}</li>
              <li>support@operator.plus</li>
            </ul>
            <div className="mt-4 inline-flex flex-col gap-2 rounded-xl bg-white/5 p-3 text-xs text-gray-300">
              <span className="font-semibold text-white">Paiement à la livraison</span>
              <span>Mobile Money · Orange Money · Espèces</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} {storeName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
