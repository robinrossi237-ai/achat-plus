import { useParams, Link } from "wouter"
import {
  useGetProduct,
  useGetRelatedProducts,
  useGetRecommendedProducts,
  useListReviews,
  useCreateReview,
  getGetProductQueryKey,
  getGetRelatedProductsQueryKey,
  getListReviewsQueryKey,
} from "@workspace/api-client-react"
import { useGetSettings } from "@workspace/api-client-react"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProductCard } from "@/components/ProductCard"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { AutoplayCarousel } from "@/components/ui/AutoplayCarousel"
import { ProductImage } from "@/components/ProductImage"
import { useShop } from "@/context/ShopContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { Shield, Truck, Star, MessageCircle, ChevronRight, ChevronLeft as ChevronLeftIcon, Heart, ShoppingCart, Minus, Plus, Eye, Headphones, X, Check, Share2, Link2 } from "lucide-react"
import { useEffect, useState } from "react"
import { buildWhatsAppMessage, WHATSAPP_NUMBER } from "@/lib/utils"

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const productId = Number(id)

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  })
  const { data: relatedProducts } = useGetRelatedProducts(productId, {
    query: { enabled: !!productId, queryKey: getGetRelatedProductsQueryKey(productId) },
  })
  const { data: recommended } = useGetRecommendedProducts(productId, {
    query: { enabled: !!productId, queryKey: ['products', 'recommended', productId] },
  })
  const frequentlyBoughtTogether = recommended?.frequentlyBoughtTogether ?? []
  const mayAlsoLike = recommended?.mayAlsoLike ?? []
  const reviewParams = { productId, approved: true }
  const { data: reviews } = useListReviews(reviewParams, {
    query: { enabled: !!productId, queryKey: getListReviewsQueryKey(reviewParams) },
  })
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);
  const { addToCart, addRecentlyViewed, toggleFavorite, isFavorite } = useShop()
  const { data: shopSettings } = useGetSettings()
  const whatsappNumber = shopSettings?.whatsapp?.replace(/\D/g, "") || WHATSAPP_NUMBER
  const storeName = shopSettings?.storeName || "Achat+"

  useEffect(() => {
    if (!product) return
    const img = product.images?.[0]
    const setMeta = (selector: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); document.head.appendChild(el) }
      el.setAttribute('content', value)
    }
    if (img) { setMeta('meta[property="og:image"]', img); setMeta('meta[name="twitter:image"]', img) }
    setMeta('meta[property="og:title"]', product.name)
    setMeta('meta[property="og:description"]', `${product.name} à ${formatPrice(product.finalPrice)} sur ${storeName}`)
  }, [product, storeName])

  useEffect(() => {
    if (product) addRecentlyViewed(product)
  }, [product?.id])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 bg-muted w-1/3 mb-8 rounded"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2 h-96 bg-muted rounded-xl"></div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="h-10 bg-muted w-3/4 rounded"></div>
              <div className="h-6 bg-muted w-1/4 rounded"></div>
              <div className="h-32 bg-muted w-full rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Produit introuvable</h1>
          <Link href="/produits">
            <Button>Retour au catalogue</Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  const rating = product.averageRating == null ? null : Number(product.averageRating)
  const images = product.images?.length ? product.images : [null]

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildWhatsAppMessage([{ name: product.name, quantity, price: product.finalPrice }]))
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank")
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/produit/${product.id}` : ""
  const shareImage = product.images?.[0] || ""
  const shareText = `${product.name} - ${formatPrice(product.finalPrice)} sur ${storeName}`

  const shareViaWhatsApp = () => {
    setShareOpen(false)
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }
  const shareViaFacebook = () => {
    setShareOpen(false)
    const u = encodeURIComponent(shareUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank")
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => { setCopied(false); setShareOpen(false) }, 1500)
    } catch { /* ignore */ }
  }

  return (
    <AppLayout>
      <div className="bg-muted/30 py-4 border-b">
        <div className="container mx-auto px-4 text-sm flex items-center gap-2 text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/produits?category=${product.categoryId}`} className="hover:text-primary">{product.categoryName}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border mb-12">
          <div className="flex flex-col md:flex-row gap-10">
            {/* Gallery */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted border relative cursor-pointer" onClick={() => setLightboxOpen(true)}>
                {product.isFlashSale && (
                  <Badge className="absolute top-4 right-4 z-10 bg-primary">Vente Flash</Badge>
                )}
                {product.discountPercent && (
                  <Badge className="absolute top-4 left-4 z-10 bg-destructive">-{product.discountPercent}%</Badge>
                )}
                <ProductImage src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImage(idx)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${activeImage === idx ? 'border-primary' : 'border-transparent'}`}
                    >
                      <ProductImage src={img} alt={`${product.name} vue ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="w-full md:w-1/2 flex flex-col">
              {product.brand && <span className="text-primary font-semibold mb-2">{product.brand}</span>}
              <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                {product.reviewCount ? (
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 font-bold text-secondary">
                      {rating !== null && Number.isFinite(rating) ? rating.toFixed(1) : "N/A"}
                    </span>
                  </div>
                ) : null}
                {product.reviewCount ? (
                  <span className="text-muted-foreground">{product.reviewCount} avis</span>
                ) : null}
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span data-testid="text-product-views">{product.viewCount || 0} vues</span>
                </span>
                {product.reviewCount ? <span className="text-muted-foreground">|</span> : null}
                <Badge variant={product.stockStatus === 'available' ? 'default' : product.stockStatus === 'low' ? 'secondary' : 'destructive'} 
                       className={product.stockStatus === 'available' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                  {product.stockStatus === 'available' ? 'En stock' : product.stockStatus === 'low' ? 'Stock faible' : 'Rupture'}
                </Badge>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-4xl font-bold text-secondary">{formatPrice(product.finalPrice)}</span>
                  {product.originalPrice && product.originalPrice > product.finalPrice && (
                    <span className="text-xl text-muted-foreground line-through mb-1">{formatPrice(product.originalPrice)}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Taxes incluses.</p>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-decrease-product-quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="w-10 text-center font-semibold" data-testid="text-product-quantity">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-increase-product-quantity" onClick={() => setQuantity((value) => Math.min(product.stockQuantity || 99, value + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
                <Button variant="outline" className="flex-1" data-testid="button-add-detail-cart" onClick={() => addToCart(product, quantity)} disabled={product.stockStatus === "out"}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Ajouter au panier
                </Button>
                <Button variant="outline" size="icon" data-testid="button-detail-favorite" aria-label={isFavorite(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"} onClick={() => toggleFavorite(product)}>
                  <Heart className={`h-4 w-4 ${isFavorite(product.id) ? "fill-primary text-primary" : ""}`} />
                </Button>
                <div className="relative">
                  <Button variant="outline" size="icon" aria-label="Partager ce produit" onClick={() => setShareOpen((v) => !v)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {shareOpen && (
                    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <button onClick={shareViaWhatsApp} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"><MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp</button>
                      <button onClick={shareViaFacebook} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"><FacebookIcon className="h-4 w-4 text-blue-600" /> Facebook</button>
                      <button onClick={copyLink} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">{copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />} {copied ? "Lien copié !" : "Copier le lien"}</button>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                size="lg" 
                className="w-full mb-8 text-lg h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg"
                data-testid="button-detail-whatsapp"
                onClick={handleWhatsApp}
                disabled={product.stockStatus === 'out'}
              >
                <MessageCircle className="w-6 h-6 mr-2" />
                Commander via WhatsApp
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/50 p-6 rounded-xl mb-8">
                <div className="flex items-start gap-3">
                  <Truck className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Livraison Rapide</h4>
                    <p className="text-xs text-muted-foreground">{product.deliveryInfo || "Partout au Cameroun"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Garantie</h4>
                    <p className="text-xs text-muted-foreground">{product.warrantyInfo || "Garantie authentique"}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Specifications & Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-2 space-y-8">
{product.specifications ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                  <h3 className="text-xl font-bold mb-6 border-b pb-4">Caractéristiques</h3>
                  <div className="space-y-3">
                    {product.specifications.split('\n').filter((l: string) => l.trim()).map((line: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-primary" /></span>
                        <span className="text-foreground">{line.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h3 className="text-xl font-bold">Avis Clients ({reviews?.length || 0})</h3>
                <Button size="sm" onClick={() => setReviewOpen(true)}><Star className="w-4 h-4 mr-1" /> Laisser un avis</Button>
              </div>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{review.authorName}</span>
                          <span className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                            ))}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.dateAdded ? new Date(review.dateAdded + 'Z').toLocaleDateString('fr-FR') : ''}</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" onClick={() => setReviewOpen(true)} className="w-full text-center py-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer">
                  <Star className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground font-medium">Aucun avis pour le moment</p>
                  <p className="text-primary text-sm font-semibold mt-1">Soyez le premier à donner votre avis !</p>
                </button>
              )}
            </div>

            {reviewOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewOpen(false)}>
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold">Laisser un avis</h3>
                    <button type="button" onClick={() => setReviewOpen(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                  </div>
                  <ReviewForm productId={productId} onSuccess={() => setReviewOpen(false)} />
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="sticky top-24 rounded-[10px] border p-5"
                 style={{ borderColor: "hsl(19 100% 91%)", background: "hsl(19 100% 98%)" }}>
              <div className="flex items-center gap-2 text-[15px] font-bold text-primary">
                <Headphones className="h-5 w-5" />
                Besoin d'aide ?
              </div>
              <p className="mt-2 mb-4 text-sm text-muted-foreground leading-relaxed">
                Contactez-nous sur
                <br />
                WhatsApp
              </p>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-full items-center justify-center rounded-md bg-primary font-bold text-white transition hover:brightness-95"
                data-testid="link-product-help-whatsapp"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>

        {/* Fréquemment achetés ensemble */}
        {frequentlyBoughtTogether.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Fréquemment achetés ensemble</h2>
            <AutoplayCarousel className="w-full" contentClassName="-ml-4" autoplay autoplayInterval={3500} loop showDots>
              {frequentlyBoughtTogether.map(prod => (
                <CarouselItem key={prod.id} className="pl-4 basis-1/2 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6">
                  <ProductCard product={prod} />
                </CarouselItem>
              ))}
            </AutoplayCarousel>
          </div>
        )}

        {/* Vous avez aimé, vous aimerez aussi */}
        {mayAlsoLike.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Vous avez aimé, vous aimerez aussi</h2>
            <AutoplayCarousel className="w-full" contentClassName="-ml-4" autoplay autoplayInterval={3800} loop showDots>
              {mayAlsoLike.map(prod => (
                <CarouselItem key={prod.id} className="pl-4 basis-1/2 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6">
                  <ProductCard product={prod} />
                </CarouselItem>
              ))}
            </AutoplayCarousel>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
            <AutoplayCarousel className="w-full" contentClassName="-ml-4" autoplay autoplayInterval={3500} loop showDots>
              {(relatedProducts.slice(0, 10) || []).map(prod => (
                <CarouselItem key={prod.id} className="pl-4 basis-1/2 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6">
                  <ProductCard product={prod} />
                </CarouselItem>
              ))}
            </AutoplayCarousel>
          </div>
        )}
      </div>
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxOpen(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setLightboxOpen(false); }}>
          <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLightboxOpen(false); }}><X className="w-8 h-8" /></button>
          <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveImage((activeImage - 1 + images.length) % images.length); }}><ChevronLeftIcon className="w-10 h-10" /></button>
          <div className="max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <ProductImage src={images[activeImage]} alt={product.name} className="max-w-full max-h-full object-contain" />
          </div>
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveImage((activeImage + 1) % images.length); }}><ChevronRight className="w-10 h-10" /></button>
        </div>
      )}
    </AppLayout>
  )
}

function ReviewForm({ productId, onSuccess }: { productId: number; onSuccess?: () => void }) {
  const createReview = useCreateReview()
  const [author, setAuthor] = useState("")
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !comment.trim() || rating === 0) return
    setStatus("submitting")
    createReview.mutate(
      { productId, author: author.trim(), rating, comment: comment.trim() },
      {
        onSuccess: () => {
          setStatus("success")
          setAuthor("")
          setRating(0)
          setComment("")
          onSuccess?.()
        },
        onError: () => {
          setStatus("idle")
        },
      }
    )
  }

  if (status === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="review-submitting">
        <div className="relative mb-6">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Star className="h-7 w-7 text-primary absolute inset-0 m-auto" />
        </div>
        <p className="font-semibold text-secondary text-lg">Envoi de votre avis...</p>
        <p className="text-sm text-muted-foreground mt-1">Merci de patienter un instant</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="review-success">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
            <Check className="h-7 w-7" strokeWidth={3} />
          </span>
        </div>
        <p className="font-bold text-secondary text-xl">Merci pour votre avis !</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">Votre avis a bien été envoyé et est maintenant visible sur ce produit.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-5 text-sm font-semibold text-primary hover:underline">Laisser un autre avis</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Note</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5"
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              <Star className={`w-7 h-7 transition-colors ${(hovered || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="review-author">Votre nom</label>
        <input
          id="review-author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Ex: Jean K."
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="review-comment">Votre avis</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Décrivez votre expérience avec ce produit..."
          required
          rows={4}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>
      <Button
        type="submit"
        disabled={createReview.isPending || !author.trim() || !comment.trim() || rating === 0}
        className="w-full sm:w-auto"
      >
        {createReview.isPending ? "Envoi..." : "Publier mon avis"}
      </Button>
    </form>
  )
}
