import { useEffect, useState } from "react"
import { MessageCircle, X, HelpCircle } from "lucide-react"
import { useGetSettings } from "@workspace/api-client-react"
import { WHATSAPP_NUMBER } from "@/lib/utils"

export function FloatingWhatsApp() {
  const { data: settings } = useGetSettings()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  const whatsappNumber = settings?.whatsapp?.replace(/\D/g, "") || WHATSAPP_NUMBER

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 250)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleChat = () => {
    const text = encodeURIComponent("Bonjour Achat+ 👋, j'aimerais des informations / négocier un prix.")
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank")
  }

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-4"}`}>
      {open && (
        <div className="flex flex-col gap-2 rounded-2xl border bg-white p-3 shadow-xl w-60">
          <button
            type="button"
            onClick={handleChat}
            className="flex items-center gap-2 rounded-xl bg-green-500 px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5 shrink-0" />
            Négocier un prix
          </button>
          <button
            type="button"
            onClick={handleChat}
            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-secondary/90 transition-colors"
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            Poser une question
          </button>
        </div>
      )}
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-lg transition-transform hover:scale-105"
        >
          <X className="h-7 w-7" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Contacter sur WhatsApp"
          data-testid="floating-whatsapp"
          className="group relative flex items-center gap-2 rounded-full bg-green-500 px-5 py-4 text-white shadow-lg transition-all hover:bg-green-600 hover:scale-105"
        >
          <span className="absolute -top-1 -left-1 h-4 w-4 animate-ping rounded-full bg-green-300 opacity-75" />
          <MessageCircle className="h-7 w-7" />
          <span className="hidden sm:inline text-sm font-bold">WhatsApp</span>
        </button>
      )}
    </div>
  )
}