import { Link } from "wouter"
import { useGetSettings } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductImage } from "@/components/ProductImage"
import { useShop } from "@/context/ShopContext"
import { formatPrice, buildWhatsAppMessage, WHATSAPP_NUMBER } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from "lucide-react"

export default function Cart() {
  const { cart, cartCount, cartSubtotal, updateCartQuantity, removeFromCart, clearCart } = useShop()
  const { data: shopSettings } = useGetSettings()
  const whatsappNumber = shopSettings?.whatsapp?.replace(/\D/g, "") || WHATSAPP_NUMBER

  const handleWhatsApp = () => {
    const message = buildWhatsAppMessage(
      cart.map((item) => ({ name: item.product.name, quantity: item.quantity, price: item.product.finalPrice })),
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank")
  }

  if (!cart.length) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-primary">
            <ShoppingBag className="h-9 w-9" />
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-3">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-8">Ajoutez des produits pour préparer votre commande WhatsApp.</p>
          <Link href="/produits"><Button data-testid="link-shop-empty-cart">Découvrir le catalogue <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Achat+ panier</p>
            <h1 className="text-3xl font-bold text-secondary">Votre commande</h1>
          </div>
          <span className="text-sm text-muted-foreground">{cartCount} article{cartCount > 1 ? "s" : ""}</span>
        </div>

        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold">Articles sélectionnés</h2>
            <Button variant="ghost" size="sm" onClick={clearCart} data-testid="button-clear-cart" className="text-muted-foreground hover:text-destructive">
              Vider le panier
            </Button>
          </div>

          <div className="space-y-5">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 border-b pb-5 last:border-0 last:pb-0" data-testid={`row-cart-item-${item.product.id}`}>
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <ProductImage src={item.product.images?.[0]} alt={item.product.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/produit/${item.product.id}`} className="font-semibold hover:text-primary">{item.product.name}</Link>
                  <p className="mt-1 text-sm text-secondary font-bold">{formatPrice(item.product.finalPrice)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border">
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-decrease-cart-${item.product.id}`} onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm font-medium" data-testid={`text-cart-quantity-${item.product.id}`}>{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-increase-cart-${item.product.id}`} onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" data-testid={`button-remove-cart-${item.product.id}`} onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 border-t pt-5">
            <div className="flex justify-between text-lg font-bold">
              <span>Sous-total</span>
              <span className="text-secondary" data-testid="text-cart-subtotal">{formatPrice(cartSubtotal)}</span>
            </div>
            <Button
              onClick={handleWhatsApp}
              data-testid="button-cart-command-whatsapp"
              className="mt-5 h-12 w-full bg-green-500 text-white hover:bg-green-600"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Commander sur WhatsApp
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Toutes les discussions se feront sur WhatsApp. Paiement à la livraison.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}