import { AppLayout } from "@/components/layout/AppLayout"
import { Link } from "wouter"
import { ChevronRight } from "lucide-react"
import { useGetSettings } from "@workspace/api-client-react"

type InfoSection = {
  title: string
  body: string
}

type InfoPageContent = {
  slug: string
  title: string
  intro: string
  sections: InfoSection[]
}

const heroBg: Record<string, InfoPageContent> = {
  livraison: {
    slug: "livraison",
    title: "Livraison",
    intro: "Découvrez nos conditions et délais de livraison partout au Cameroun.",
    sections: [
      { title: "Délais de livraison", body: "Nous livrons rapidement dans les grandes villes (Yaoundé, Douala, Garoua, Bamenda, Bafoussam, Ngaoundéré) et dans tout le Cameroun. Un créneau est convenu avec vous par téléphone ou WhatsApp après confirmation de votre commande." },
      { title: "Frais de livraison", body: "Les frais de livraison sont communiqués lors de la confirmation sur WhatsApp selon votre localisation et le poids de votre commande. Le montant exact vous est confirmé avant l'expédition." },
      { title: "Zones couvertes", body: "Nous couvrons l'essentiel des localités du Cameroun. Pour une zone éloignée, contactez-nous, nous trouverons une solution." },
      { title: "Paiement à la livraison", body: "Aucun paiement en ligne n'est requis. Vous payez à la réception de votre commande, en espèces, Mobile Money ou Orange Money." },
    ],
  },
  "politique-retour": {
    slug: "politique-retour",
    title: "Politique de retour",
    intro: "Nous tenons à votre satisfaction. Retour simple et facile.",
    sections: [
      { title: "Dans quel délai ?", body: "Vous disposez d'un délai de 7 jours après réception pour demander un retour, sous réserve que le produit soit dans son état d'origine (non utilisé, emballage intact)." },
      { title: "Cas d'éligibilité", body: "Un produit reçu défectueux ou endommagé, un article non conforme à la commande, ou un article inadapté peuvent faire l'objet d'un retour." },
      { title: "Comment procéder ?", body: "Contactez-nous sur WhatsApp avec photo du produit et de son emballage. Nous convenons ensemble de la solution : échange, bon d'achat ou remboursement." },
      { title: "Remarques", body: "Les produits d'hygiène ouverts et les produits sur mesure ne sont pas repris, sauf défaut de notre part." },
    ],
  },
  "qui-sommes-nous": {
    slug: "qui-sommes-nous",
    title: "Qui sommes-nous ?",
    intro: "Une jeune marque camerounaise tournée vers la totalité de vos besoins du quotidien.",
    sections: [
      { title: "Notre mission", body: "Achat+ est un site de vente en ligne 100% camerounais. Notre objectif est de rassembler des produits de qualité, adaptés au marché national, pour satisfaire les besoins de toute la population." },
      { title: "Nos engagements", body: "Produits garantis, livraison rapide, service après-vente et retour facile. Nous négocions directement avec vous sur WhatsApp pour vous offrir les meilleurs prix." },
      { title: "Notre mode de fonctionnement", body: "Pas de paiement en ligne. Tout se conclut de façon simple et humaine : vous commandez, nous confirmons par WhatsApp, et vous payez à la livraison." },
    ],
  },
}

export function InfoPage({ slug }: { slug: string }) {
  const content = heroBg[slug]
  const { data: settings } = useGetSettings()

  if (!content) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Page introuvable</h1>
          <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-4xl">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{content.title}</span>
        </nav>
        <h1 className="text-4xl font-bold mb-3 text-secondary">{content.title}</h1>
        <p className="text-lg text-muted-foreground mb-10">{content.intro}</p>
        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold mb-2 text-secondary">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        {settings?.whatsapp ? (
          <div className="mt-10 rounded-2xl bg-secondary text-white p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Une question ?</h3>
            <p className="mb-4 text-gray-200">Contactez-nous directement sur WhatsApp, nous répondons rapidement.</p>
            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-green-500 px-6 py-3 font-semibold text-white hover:bg-green-600 transition-colors">
              Discuter sur WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}