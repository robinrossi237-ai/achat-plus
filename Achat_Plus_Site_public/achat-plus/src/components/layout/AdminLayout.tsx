import React from "react"
import { AdminSidebar } from "./AdminSidebar"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-muted">
      <AdminSidebar />
      <div className="sm:ml-64 p-4 sm:p-8">
        {children}
      </div>
    </div>
  )
}
