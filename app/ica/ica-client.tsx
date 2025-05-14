"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Download, Pencil } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface IcaItem {
  id: string
  "Nº Guía": string
  Fecha: string
  Propietario: string
  NIT: string
  Machos: string
  Hembras: string
  "Total Animales": string
  Kilos: string
  Total: string
}

export function IcaClient({ tipoAnimal }: { tipoAnimal: "bovinos" | "porcinos" }) {
  const [data, setData] = useState<IcaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [usingAltApi, setUsingAltApi] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      let err = null
      try {
        setLoading(true)
        setError(null)
        setErrorDetails(null)

        // Intentar con la API principal primero
        const apiUrl = usingAltApi ? `/api/ica-alt/${tipoAnimal}` : `/api/ica/${tipoAnimal}`

        const response = await fetch(apiUrl)
        const result = await response.json()

        if (!response.ok) {
          // Si estamos usando la API principal y falla, intentar con la alternativa
          if (!usingAltApi) {
            setUsingAltApi(true)
            throw new Error("Intentando con API alternativa...")
          }
          throw new Error(result.error || `Error al cargar datos: ${response.status}`)
        }

        if (result.data && Array.isArray(result.data)) {
          setData(result.data)
        } else {
          throw new Error("Formato de datos inesperado")
        }
      } catch (error) {
        err = error
        // Si estamos intentando con la API alternativa, mostrar el error
        if (usingAltApi || err.message !== "Intentando con API alternativa...") {
          setError(err instanceof Error ? err.message : "Error desconocido")

          // Intentar obtener más detalles del error
          if (err instanceof Error) {
            setErrorDetails(err.stack || "No hay detalles adicionales disponibles")
          }

          console.error("Error al cargar datos ICA:", err)
        }
      } finally {
        // Solo cambiar el estado de carga si no estamos cambiando de API
        if (!(err && err.message === "Intentando con API alternativa...")) {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [tipoAnimal, usingAltApi])

  // Filtrar datos según el término de búsqueda
  const filteredData = data.filter(
    (item) =>
      (item["Nº Guía"]?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.Propietario?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.NIT?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.Fecha?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Crear un array con los encabezados
    const headers = ["Nº Guía", "Fecha", "Propietario", "NIT", "Machos", "Hembras", "Total Animales", "Kilos", "Total"]

    // Crear filas de datos
    const rows = filteredData.map((item) => [
      item["Nº Guía"] || "",
      item.Fecha || "",
      item.Propietario || "",
      item.NIT || "",
      item.Machos || "",
      item.Hembras || "",
      item["Total Animales"] || "",
      item.Kilos || "",
      item.Total || "",
    ])

    // Combinar encabezados y filas
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    // Crear un enlace de descarga
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `lista_ica_${tipoAnimal}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para editar una guía
  const handleEdit = (id: string) => {
    router.push(`/guias/editar/${id}`)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Lista ICA - {tipoAnimal === "bovinos" ? "Bovinos" : "Porcinos"}</CardTitle>
          <Button onClick={exportToExcel} disabled={loading || !!error || filteredData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por guía, propietario, NIT o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 ml-2">
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>

            {errorDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto max-h-40">
                <p className="font-semibold">Detalles técnicos:</p>
                <pre className="whitespace-pre-wrap">{errorDetails}</pre>
              </div>
            )}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron registros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Nº Guía</th>
                  <th className="border p-2 text-left">Fecha</th>
                  <th className="border p-2 text-left">Propietario</th>
                  <th className="border p-2 text-left">NIT</th>
                  <th className="border p-2 text-right">Machos</th>
                  <th className="border p-2 text-right">Hembras</th>
                  <th className="border p-2 text-right">Total Animales</th>
                  <th className="border p-2 text-right">Kilos</th>
                  <th className="border p-2 text-right">Total</th>
                  <th className="border p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="border p-2">{item["Nº Guía"] || "-"}</td>
                    <td className="border p-2">{item.Fecha || "-"}</td>
                    <td className="border p-2">{item.Propietario || "-"}</td>
                    <td className="border p-2">{item.NIT || "-"}</td>
                    <td className="border p-2 text-right">{item.Machos || "0"}</td>
                    <td className="border p-2 text-right">{item.Hembras || "0"}</td>
                    <td className="border p-2 text-right">{item["Total Animales"] || "0"}</td>
                    <td className="border p-2 text-right">{item.Kilos || "0"}</td>
                    <td className="border p-2 text-right">{item.Total || "0"}</td>
                    <td className="border p-2 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item.id)}
                        title="Editar guía"
                        aria-label="Editar guía"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
