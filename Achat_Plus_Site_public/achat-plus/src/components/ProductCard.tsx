import { Link } from "wouter"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@workspace/api-client-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useShop } from "@/context/ShopContext"
import { ProductImage } from "@/components/ProductImage"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useShop()
  const effectiveDiscount = (product.promoDiscountPercent ?? 0) > 0
    ? product.promoDiscountPercent
    : (product.discountPercent ?? 0)

  return (
    <Card data-testid={`card-product-${product.id}`} className="group relative h-[320px] md:h-[330px] lg:h-[340px] w-full border-border/60 bg-white rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-secondary/10 flex flex-col">
      <Link href={`/produit/${product.id}`} className="relative block h-[60%] min-h-0 overflow-hidden bg-muted rounded-t-xl">
        {effectiveDiscount > 0 ? (
          <Badge className="absolute top-2 left-2 z-10 bg-destructive text-white border-none">
            -{effectiveDiscount}%
          </Badge>
        ) : null}
        <ProductImage
          src={product.images?.[0]}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-500 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-secondary/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {product.stockStatus === "out" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold px-4 py-2 bg-red-600 rounded-md">Rupture de stock</span>
          </div>
        )}
      </Link>

      <CardContent className="p-2.5 pt-2 flex-1 flex flex-col min-h-0">
        <Link href={`/produit/${product.id}`}>
          <h3 className="font-semibold text-[13px] text-foreground line-clamp-1 truncate hover:text-primary transition-colors mb-1">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-1.5">
          <div className="h-7 leading-tight">
            {((product.promoPrice ?? product.finalPrice) < (product.originalPrice ?? 0)) && (
              <div className="text-[10px] text-muted-foreground line-through leading-none">{formatPrice(product.originalPrice)}</div>
            )}
            <div className="font-bold text-sm text-secondary leading-tight">{formatPrice(product.promoPrice ?? product.finalPrice)}</div>
          </div>

          <Button
            type="button"
            data-testid={`button-buy-${product.id}`}
            aria-label={`Acheter ${product.name}`}
            className="w-full h-9 gap-1.5 text-xs font-bold shadow-sm"
            disabled={product.stockStatus === "out"}
            onClick={() => addToCart(product)}
          >
            <ShoppingCart className="w-4 h-4" />
            Acheter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}