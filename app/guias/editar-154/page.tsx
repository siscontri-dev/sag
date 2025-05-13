"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Componente para mostrar el estado de carga
function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando guía #154...</h3>
          <p className="text-gray-500">Por favor espere mientras recuperamos la información.</p>
        </div>
      </div>
    </div>
  )
}

// Componente principal
export default function EditarGuia154Page() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "error" | "success" | "redirecting">("loading")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargarGuia() {
      try {
        setStatus("loading")
        setMessage("Verificando guía #154...")

        // Intentar obtener la guía directamente desde la API
        const response = await fetch("/api/guias/154")
        const data = await response.json()

        if (data && data.id === 154) {
          setStatus("success")
          setMessage("Guía #154 encontrada. Redirigiendo...")

          // Esperar un momento y luego redirigir
          setTimeout(() => {
            setStatus("redirecting")
            router.push("/guias/editar/154")
          }, 1500)
        } else {
          // Si no se encuentra, intentar repararla
          setMessage("Intentando reparar la guía #154...")

          // Llamada directa a la base de datos para verificar y activar la guía
          const repairResponse = await fetch("/api/activar-guia/154", {
            method: "POST",
          })

          const repairData = await repairResponse.json()

          if (repairData.success) {
            setStatus("success")
            setMessage("Guía #154 reparada. Redirigiendo...")

            // Esperar un momento y luego redirigir
            setTimeout(() => {
              setStatus("redirecting")
              router.push("/guias/editar/154")
            }, 1500)
          } else {
            throw new Error(repairData.error || "No se pudo reparar la guía")
          }
        }
      } catch (err) {
        setStatus("error")
        setError(err instanceof Error ? err.message : "Error desconocido")
        setMessage("No se pudo cargar o reparar la guía #154.")
      }
    }

    cargarGuia()
  }, [router])

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Guía #154</CardTitle>
            <CardDescription>Acceso especial a la guía #154</CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Procesando...</h3>
                <p className="text-gray-500">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
                <p className="text-gray-500 mb-4">{message}</p>

                {error && (
                  <div className="w-full bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <Button variant="outline" asChild>
                    <Link href="/guias" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Volver a Guías
                    </Link>
                  </Button>
                  <Button onClick={() => window.location.reload()}>Intentar nuevamente</Button>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">¡Éxito!</h3>
                <p className="text-gray-500 mb-4">{message}</p>
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
            )}

            {status === "redirecting" && (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Redirigiendo...</h3>
                <p className="text-gray-500">Por favor espere mientras lo redirigimos.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
