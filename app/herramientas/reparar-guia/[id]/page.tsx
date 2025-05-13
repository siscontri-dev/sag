"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2, Home, ArrowLeft, PenToolIcon as Tool } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RepararGuiaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "diagnostico" | "reparando" | "error" | "success">("loading")
  const [message, setMessage] = useState("")
  const [diagnostico, setDiagnostico] = useState<any>(null)
  const [acciones, setAcciones] = useState<string[]>([])
  const [guia, setGuia] = useState<any>(null)
  const { id } = params

  useEffect(() => {
    async function realizarDiagnostico() {
      try {
        setStatus("diagnostico")
        setMessage(`Realizando diagnóstico de la guía ${id}...`)

        const response = await fetch(`/api/diagnostico-guia/${id}`)
        const data = await response.json()

        if (data.success) {
          setDiagnostico(data.diagnostico)
          setGuia(data.guia)

          if (!data.diagnostico.existeGuia) {
            setStatus("error")
            setMessage(`La guía con ID ${id} no existe en la base de datos.`)
          } else {
            setMessage("Diagnóstico completado. ¿Desea intentar reparar esta guía?")
          }
        } else {
          setStatus("error")
          setMessage(data.message || "Error al realizar el diagnóstico.")
        }
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Error desconocido al realizar el diagnóstico.")
      }
    }

    realizarDiagnostico()
  }, [id])

  const repararGuia = async () => {
    try {
      setStatus("reparando")
      setMessage(`Reparando guía ${id}...`)

      const response = await fetch(`/api/reparar-guia/${id}`)
      const data = await response.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message)
        setAcciones(data.acciones)
        setGuia(data.guia)

        // Esperar 3 segundos y luego redirigir a la página de edición
        setTimeout(() => {
          router.push(`/guias/editar/${id}`)
        }, 3000)
      } else {
        setStatus("error")
        setMessage(data.message || "No se pudo reparar la guía.")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Error desconocido al reparar la guía.")
    }
  }

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
          <span className="text-gray-700">Reparar Guía {id}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tool className="h-5 w-5" />
              Herramienta de Reparación - Guía #{id}
            </CardTitle>
            <CardDescription>
              Esta herramienta diagnostica y repara problemas con guías que no se pueden editar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Iniciando...</h3>
                  <p className="text-gray-500">{message}</p>
                </>
              )}

              {status === "diagnostico" && (
                <>
                  {!diagnostico ? (
                    <>
                      <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnosticando guía...</h3>
                      <p className="text-gray-500">{message}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Resultado del diagnóstico</h3>

                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                          <h4 className="font-medium text-gray-800 mb-2">Información de la guía:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {Object.entries(diagnostico).map(([key, value]) => (
                              <li key={key} className="flex justify-between">
                                <span className="font-medium">{key}:</span>
                                <span>{String(value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <p className="text-gray-700 mb-4">{message}</p>

                        <div className="flex gap-3 mt-4">
                          <Button variant="outline" asChild>
                            <Link href="/guias" className="flex items-center gap-2">
                              <ArrowLeft className="h-4 w-4" />
                              Volver a Guías
                            </Link>
                          </Button>
                          <Button onClick={repararGuia}>Intentar reparar</Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {status === "reparando" && (
                <>
                  <Loader2 className="h-12 w-12 text-amber-500 animate-spin mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reparando guía...</h3>
                  <p className="text-gray-500">{message}</p>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reparación completada</h3>
                  <p className="text-gray-500 mb-4">{message}</p>

                  {acciones.length > 0 && (
                    <div className="w-full bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-green-800 mb-2">Acciones realizadas:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {acciones.map((accion, index) => (
                          <li key={index}>• {accion}</li>
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
                      <Link href={`/guias/editar/${id}`}>Ir a editar ahora</Link>
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
