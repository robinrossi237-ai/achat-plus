import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  ShoppingCart, 
  Users, 
  Megaphone,
  MessageSquare,
  LogOut,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import logoPath from "@assets/ChatGPT_Image_Aug_5,_2026,_07_28_33_PM_1785955522844.png"
import { Button } from "../ui/button"

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/categories", label: "Catégories", icon: Tags },
  { href: "/admin/fournisseurs", label: "Fournisseurs", icon: Users },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
  { href: "/admin/avis", label: "Avis clients", icon: MessageSquare },
]

export function AdminSidebar() {
  const [location] = useLocation()

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-secondary text-white transition-transform -translate-x-full sm:translate-x-0">
      <div className="h-full px-4 py-6 overflow-y-auto flex flex-col">
        <Link href="/" className="flex items-center gap-3 mb-10 px-2">
          <img src={logoPath} alt="Achat+ Logo" className="h-10 w-10 bg-white rounded p-1" />
          <span className="text-xl font-bold">
            Achat<span className="text-primary">+</span> Admin
          </span>
        </Link>

        <ul className="space-y-2 font-medium flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/admin")
            
            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg hover:bg-white/10 transition-colors group",
                    isActive ? "bg-primary text-white" : "text-gray-300 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="pt-8 space-y-2 border-t border-white/10">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
              <ChevronLeft className="w-5 h-5 mr-3" />
              Retour au site
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10">
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </div>
    </aside>
  )
}
