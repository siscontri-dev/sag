"use client"

import { Button } from "@/components/ui/button"
import { Wrench } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function Guia154RepairButton() {
  const [showButton, setShowButton] = useState(true)

  if (!showButton) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Wrench className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Reparación de Guía #154</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>Si estás teniendo problemas para editar la guía #154, puedes intentar repararla automáticamente.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/guias/editar-154">Reparar Guía #154</Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowButton(false)}>
                Descartar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
