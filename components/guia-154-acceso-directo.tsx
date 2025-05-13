"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function Guia154AccesoDirecto() {
  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Acceso directo a Guía #154</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          Si estás teniendo problemas para acceder a la guía #154, puedes usar este acceso directo:
        </p>
        <Button asChild variant="outline" className="bg-white border-amber-300 hover:bg-amber-50">
          <Link href="/guia-154">Editar Guía #154 (Modo Directo)</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
