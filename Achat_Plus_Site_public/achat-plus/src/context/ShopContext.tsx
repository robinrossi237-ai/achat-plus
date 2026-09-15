import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@workspace/api-client-react"

export interface CartItem {
  product: Product
  quantity: number
}

interface ShopContextValue {
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  favorites: Product[]
  recentlyViewed: Product[]
  addToCart: (product: Product, quantity?: number) => void
  updateCartQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  isFavorite: (productId: number) => boolean
  toggleFavorite: (product: Product) => void
  addRecentlyViewed: (product: Product) => void
}

const ShopContext = createContext<ShopContextValue | undefined>(undefined)

const STORAGE_KEYS = {
  cart: "achat-plus-cart",
  favorites: "achat-plus-favorites",
  recentlyViewed: "achat-plus-recently-viewed",
} as const

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => readStorage(STORAGE_KEYS.cart, []))
  const [favorites, setFavorites] = useState<Product[]>(() => readStorage(STORAGE_KEYS.favorites, []))
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => readStorage(STORAGE_KEYS.recentlyViewed, []))
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)), [cart])
  useEffect(() => window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites)), [favorites])
  useEffect(() => window.localStorage.setItem(STORAGE_KEYS.recentlyViewed, JSON.stringify(recentlyViewed)), [recentlyViewed])

  const value = useMemo<ShopContextValue>(() => ({
    cart,
    cartCount: cart.reduce((total, item) => total + item.quantity, 0),
    cartSubtotal: cart.reduce((total, item) => total + item.product.finalPrice * item.quantity, 0),
    favorites,
    recentlyViewed,
    addToCart: (product, quantity = 1) => {
      if (product.stockStatus === "out") return
      setCart((current) => {
        const existing = current.find((item) => item.product.id === product.id)
        const maxQuantity = product.stockQuantity && product.stockQuantity > 0 ? product.stockQuantity : 99
        if (existing) {
          return current.map((item) => item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, maxQuantity) }
            : item)
        }
        return [...current, { product, quantity: Math.min(quantity, maxQuantity) }]
      })
      setIsCartOpen(true)
    },
    updateCartQuantity: (productId, quantity) => {
      setCart((current) => current
        .map((item) => item.product.id === productId
          ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stockQuantity || 99)) }
          : item)
        .filter((item) => item.quantity > 0))
    },
    removeFromCart: (productId) => setCart((current) => current.filter((item) => item.product.id !== productId)),
    clearCart: () => setCart([]),
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    isFavorite: (productId) => favorites.some((product) => product.id === productId),
    toggleFavorite: (product) => setFavorites((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [product, ...current]),
    addRecentlyViewed: (product) => setRecentlyViewed((current) => [
      product,
      ...current.filter((item) => item.id !== product.id),
    ].slice(0, 8)),
  }), [cart, favorites, recentlyViewed, isCartOpen])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error("useShop doit être utilisé dans ShopProvider")
  return context
}
