import { AutoplayCarousel } from "@/components/ui/AutoplayCarousel"
import { CarouselItem } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import { MessageCircle } from "lucide-react"
import { WHATSAPP_NUMBER } from "@/lib/utils"

type Settings = {
  heroTitle?: string
  heroSubtitle?: string
  heroCtaText?: string
  heroImage?: string | null
}

type HeroSlide = {
  id: number
  title: string[]
  accentLast?: boolean
  subtitle: string
  ctaText: string
  ctaHref: string
  secondaryText?: string
  secondaryHref?: string
}

export function HeroSlider({ settings, heroBg }: { settings?: Settings; heroBg: string }) {
  const heroImage = settings?.heroImage || heroBg

  const slides: HeroSlide[] = [
    {
      id: 0,
      title: (settings?.heroTitle || "Tout ce qu'il vous faut, à portée de clic.").split("\n"),
      subtitle:
        settings?.heroSubtitle ||
        "Votre marché en ligne de confiance. Livraison rapide partout au Cameroun. Produits garantis et service client réactif.",
      ctaText: settings?.heroCtaText || "Découvrir le catalogue",
      ctaHref: "/produits",
      secondaryText: "Voir les offres",
      secondaryHref: "/promotions",
    },
    {
      id: 1,
      title: ["Ventes Flash,", " profitez-en vite !"],
      accentLast: false,
      subtitle: "Des remises exceptionnelles sur une sélection limitée. Découvrez les offres du moment avant épuisement du stock.",
      ctaText: "Voir les promos",
      ctaHref: "/promotions",
    },
    {
      id: 2,
      title: ["Une question ?", " Négociez sur WhatsApp."],
      accentLast: false,
      subtitle: "Discutez directement avec notre équipe pour négocier vos prix et passer vos commandes. Paiement à la livraison partout au Cameroun.",
      ctaText: "Nous contacter",
      ctaHref: "#wh",
      secondaryText: "Découvrir le catalogue",
      secondaryHref: "/produits",
    },
  ]

  const openWhatsApp = () => {
    const text = encodeURIComponent("Bonjour Achat+, j'aimerais avoir des informations sur vos produits / négocier un prix.")
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank")
  }

  return (
    <AutoplayCarousel
      className="w-full"
      autoplay
      autoplayInterval={5000}
      loop
      showArrows={false}
      showDots
      contentClassName=""
    >
      {slides.map((slide) => (
        <CarouselItem key={slide.id} className="basis-full">
          <div className="relative pt-14 pb-20 md:pt-16 md:pb-32">
            <div
              className="absolute inset-0 opacity-25 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 to-secondary/100" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 md:mb-6 leading-tight">
                  {slide.title.map((line, i) =>
                    slide.accentLast && i === slide.title.length - 1 ? (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ) : (
                      <span key={i} className={i === slide.title.length - 1 && !slide.accentLast ? "text-primary" : ""}>
                        {line}
                        {i === 0 ? <br /> : null}
                      </span>
                    ),
                  )}
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">{slide.subtitle}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  {slide.ctaHref === "#wh" ? (
                    <Button
                      className="w-full sm:w-auto rounded-full font-semibold text-sm sm:text-lg px-5 sm:px-8 py-2.5 sm:py-6 h-auto"
                      onClick={openWhatsApp}
                    >
                      <MessageCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {slide.ctaText}
                    </Button>
                  ) : (
                    <Link href={slide.ctaHref}>
                      <Button className="w-full sm:w-auto rounded-full font-semibold text-sm sm:text-lg px-5 sm:px-8 py-2.5 sm:py-6 h-auto">
                        {slide.ctaText}
                      </Button>
                    </Link>
                  )}
                  {slide.secondaryText && slide.secondaryHref && (
                    <Link href={slide.secondaryHref}>
                      <Button
                        className="w-full sm:w-auto rounded-full font-semibold text-sm sm:text-lg px-5 sm:px-8 py-2.5 sm:py-6 h-auto border-2 border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {slide.secondaryText}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CarouselItem>
      ))}
    </AutoplayCarousel>
  )
}