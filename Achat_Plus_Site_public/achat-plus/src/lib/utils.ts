import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | undefined | null) {
  if (price === undefined || price === null) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

export const WHATSAPP_NUMBER = "221770000000"

export function buildWhatsAppMessage(
  items: Array<{ name: string; quantity: number; price: number }>,
  customer?: { name?: string; phone?: string; address?: string; deliveryType?: string; notes?: string },
) {
  const lines = [
    "Bonjour, je souhaite commander sur Achat+ :",
    "",
    ...items.map((item) => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`),
    "",
    `Total : ${formatPrice(items.reduce((total, item) => total + item.price * item.quantity, 0))}`,
  ]
  if (customer?.name) lines.push("", `Nom : ${customer.name}`)
  if (customer?.phone) lines.push(`Téléphone : ${customer.phone}`)
  if (customer?.deliveryType) lines.push(`Livraison : ${customer.deliveryType}`)
  if (customer?.address) lines.push(`Adresse : ${customer.address}`)
  if (customer?.notes) lines.push(`Notes : ${customer.notes}`)
  lines.push("", "Pouvez-vous confirmer la disponibilité ?")
  return lines.join("\n")
}
