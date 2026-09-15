import { Link } from "wouter"
import { useShop } from "@/context/ShopContext"
import { useGetSettings } from "@workspace/api-client-react"
import { formatPrice, buildWhatsAppMessage, WHATSAPP_NUMBER } from "@/lib/utils"
import { ProductImage } from "@/components/ProductImage"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowDownToLine } from "lucide-react"

export function CartDrawer() {
  const { isCartOpen, closeCart, cart, cartCount, cartSubtotal, updateCartQuantity, removeFromCart } = useShop()
  const { data: settings } = useGetSettings()
  const whatsappNumber = settings?.whatsapp?.replace(/\D/g, "") || WHATSAPP_NUMBER

  const handleWhatsApp = () => {
    const message = buildWhatsAppMessage(
      cart.map((item) => ({ name: item.product.name, quantity: item.quantity, price: item.product.finalPrice })),
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => { if (!open) closeCart() }}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm" onInteractOutside={() => closeCart()} onEscapeKeyDown={() => closeCart()}>
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Mon panier
            {cartCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{cartCount}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-primary">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <p className="text-muted-foreground">Votre panier est vide.</p>
            <Link href="/produits" onClick={closeCart}>
              <Button>Découvrir le catalogue</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-5">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex gap-3" data-testid={`row-cart-drawer-${item.product.id}`}>
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <ProductImage src={item.product.images?.[0]} alt={item.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/produit/${item.product.id}`} onClick={closeCart} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm font-bold text-secondary">{formatPrice(item.product.finalPrice)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter className="border-t px-5 py-4">
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Sous-total</span>
                  <span className="text-secondary" data-testid="text-cart-drawer-subtotal">{formatPrice(cartSubtotal)}</span>
                </div>
                <Link href="/panier" onClick={closeCart} className="w-full">
                  <Button variant="outline" className="w-full" data-testid="link-cart-drawer-view">
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Voir mon panier
                  </Button>
                </Link>
                <Button className="w-full bg-green-500 text-white hover:bg-green-600" onClick={handleWhatsApp} data-testid="button-cart-drawer-whatsapp">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Commander sur WhatsApp
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}