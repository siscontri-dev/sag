"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EditarGuia154Page() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "error" | "success" | "repairing">("loading")
  const [message, setMessage] = useState("")
  const [diagnostico, setDiagnostico] = useState<any>(null)

  useEffect(() => {
    async function checkAndRepairGuia() {
      try {
        setStatus("loading")
        setMessage("Verificando estado de la guía 154...")

        // Intentar reparar la guía
        const response = await fetch("/api/fix-guia-154")
        const data = await response.json()

        if (data.success) {
          setStatus("success")
          setMessage("La guía ha sido reparada correctamente.")
          setDiagnostico(data.diagnostico)

          // Esperar 3 segundos y luego redirigir a la página normal de edición
          setTimeout(() => {
            router.push("/guias/editar/154")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.message || "No se pudo reparar la guía.")
          setDiagnostico(data.diagnostico)
        }
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Error desconocido al reparar la guía.")
      }
    }

    checkAndRepairGuia()
  }, [router])

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <Home className="h-5 w-5" />
          </Link>
          <span className="text-gray-500">/</span>
          <Link href="/guias" className="text-gray-500 hover:text-gray-700">
            Guías
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">Editar Guía 154</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reparación de Guía #154</CardTitle>
            <CardDescription>Estamos verificando y reparando la guía para permitir su edición</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verificando guía...</h3>
                  <p className="text-gray-500">{message}</p>
                </>
              )}

              {status === "repairing" && (
                <>
                  <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reparando guía...</h3>
                  <p className="text-gray-500">{message}</p>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error al reparar la guía</h3>
                  <p className="text-gray-500 mb-4">{message}</p>

                  {diagnostico && (
                    <div className="w-full bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-red-800 mb-2">Diagnóstico:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {Object.entries(diagnostico).map(([key, value]) => (
                          <li key={key}>
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
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
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Guía reparada correctamente</h3>
                  <p className="text-gray-500 mb-4">{message}</p>

                  {diagnostico && (
                    <div className="w-full bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-green-800 mb-2">Diagnóstico:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {Object.entries(diagnostico).map(([key, value]) => (
                          <li key={key}>
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4">
                    Serás redirigido a la página de edición en unos segundos...
                  </p>

                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" asChild>
                      <Link href="/guias" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Guías
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/guias/editar/154">Ir a editar ahora</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
