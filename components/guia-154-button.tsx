"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function Guia154Button() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Verificar si estamos en la página de guías
    const isGuiasPage = window.location.pathname === "/guias" || window.location.pathname.startsWith("/guias?")

    if (isGuiasPage) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        variant="default"
        size="lg"
        className="rounded-full shadow-lg flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
        asChild
      >
        <Link href="/guias/editar-154">
          <AlertCircle className="h-5 w-5" />
          Acceder a Guía #154
        </Link>
      </Button>
    </div>
  )
}
