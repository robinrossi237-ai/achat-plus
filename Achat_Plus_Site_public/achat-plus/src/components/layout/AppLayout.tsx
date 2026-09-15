import React from "react"
import { Navbar } from "./Navbar"
import { Footer } from "./Footer"
import { CartDrawer } from "@/components/CartDrawer"
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
    </div>
  )
}
