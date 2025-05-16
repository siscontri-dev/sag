"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Filter, Home, FileSpreadsheet, FileIcon as FilePdf } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format, isWithinInterval, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BoletinItem {
  Fecha: string
  "G/ Deguello": string
  Cantidad: string
  "Cantidad Machos": string
  "Cantidad Hembras": string
  "Vr Deguello": string
  "Ser. Matadero": string
  Entidad: string
  Total: string
}

export function BoletinClient() {
  const [data, setData] = useState<BoletinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [usingAltApi, setUsingAltApi] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [pageSize, setPageSize] = useState<number | "all">(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [boletinNumber, setBoletinNumber] = useState("")
  const router = useRouter()

  // Generar número de boletín basado en la fecha actual
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    setBoletinNumber(`BOL-${year}${month}${day}`)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      let err = null
      try {
        setLoading(true)
        setError(null)
        setErrorDetails(null)

        // Intentar con la API principal primero
        const apiUrl = usingAltApi ? `/api/boletin-movimiento-ganado-alt` : `/api/boletin-movimiento-ganado`

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

        if (result.data) {
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

          console.error("Error al cargar datos del Boletín Movimiento de Ganado:", err)
        }
      } finally {
        // Solo cambiar el estado de carga si no estamos cambiando de API
        if (!(err && err.message === "Intentando con API alternativa...")) {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [usingAltApi])

  // Cuando cambia el filtro o el tamaño de página, volver a la primera página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateRange, pageSize])

  // Filtrar datos según el término de búsqueda y el rango de fechas
  const filteredData = useCallback(() => {
    return data.filter((item) => {
      // Filtro por término de búsqueda (en fecha o número de documento)
      const matchesSearchTerm =
        (item.Fecha?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item["G/ Deguello"]?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.Entidad?.toLowerCase() || "").includes(searchTerm.toLowerCase())

      // Filtro por rango de fechas
      let matchesDateRange = true
      if (dateRange.from && dateRange.to) {
        try {
          // Convertir la fecha de string a objeto Date
          // El formato esperado es DD/MM/YYYY
          const itemDate = parse(item.Fecha, "dd/MM/yyyy", new Date())

          matchesDateRange = isWithinInterval(itemDate, {
            start: dateRange.from,
            end: dateRange.to,
          })
        } catch (e) {
          console.error("Error al parsear fecha:", e, item.Fecha)
          matchesDateRange = true // Si hay error, no filtrar por fecha
        }
      }

      return matchesSearchTerm && matchesDateRange
    })
  }, [data, searchTerm, dateRange])

  const paginatedData = useCallback(() => {
    const filtered = filteredData()

    if (pageSize === "all") {
      return filtered
    }

    const startIndex = (currentPage - 1) * (pageSize as number)
    return filtered.slice(startIndex, startIndex + (pageSize as number))
  }, [filteredData, currentPage, pageSize])

  const totalPages = useCallback(() => {
    if (pageSize === "all") return 1

    const filtered = filteredData()
    return Math.ceil(filtered.length / (pageSize as number))
  }, [filteredData, pageSize])

  const totales = useCallback(() => {
    const filtered = filteredData()
    return filtered.reduce(
      (acc, item) => {
        acc.cantidad += Number.parseInt(item.Cantidad?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadMachos += Number.parseInt(item["Cantidad Machos"]?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadHembras += Number.parseInt(item["Cantidad Hembras"]?.replace(/,/g, "") || "0", 10) || 0
        acc.vrDeguello += Number.parseInt(item["Vr Deguello"]?.replace(/,/g, "") || "0", 10) || 0
        acc.serMatadero += Number.parseInt(item["Ser. Matadero"]?.replace(/,/g, "") || "0", 10) || 0
        acc.total += Number.parseInt(item.Total?.replace(/,/g, "") || "0", 10) || 0
        return acc
      },
      {
        cantidad: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        vrDeguello: 0,
        serMatadero: 0,
        total: 0,
      },
    )
  }, [filteredData])

  // Función para exportar a Excel (XLSX)
  const exportToExcel = useCallback(async () => {
    try {
      setExporting(true)

      // Crear título con información de filtros
      let title = `Boletín Movimiento de Ganado - ${boletinNumber}`
      if (dateRange.from && dateRange.to) {
        title += ` (${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")})`
      }
      if (searchTerm) {
        title += ` - Búsqueda: ${searchTerm}`
      }

      // Preparar los datos para la API
      const filtered = filteredData()
      const exportData = {
        title,
        data: filtered,
        boletinNumber,
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : null,
          searchTerm: searchTerm || null,
        },
      }

      // Llamar a la API para generar el Excel
      const response = await fetch(`/api/export/boletin-movimiento-ganado/excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error al exportar: ${response.status}`)
      }

      // Obtener el blob del archivo Excel
      const blob = await response.blob()

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `boletin_movimiento_ganado_${boletinNumber}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      alert("Error al exportar a Excel. Por favor, intente nuevamente.")
    } finally {
      setExporting(false)
    }
  }, [filteredData, dateRange, searchTerm, boletinNumber])

  // Función para exportar a PDF
  const exportToPdf = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const filtered = filteredData()
      const exportData = {
        title: `CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA\nBoletín Movimiento de Ganado - ${boletinNumber}`,
        data: filtered,
        boletinNumber,
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : null,
          searchTerm: searchTerm || null,
        },
      }

      // Llamar a la API para generar el PDF
      const response = await fetch(`/api/export/boletin-movimiento-ganado/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error al exportar: ${response.status}`)
      }

      // Obtener el blob del archivo PDF
      const blob = await response.blob()

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `boletin_movimiento_ganado_${boletinNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      alert("Error al exportar a PDF. Por favor, intente nuevamente.")
    } finally {
      setExporting(false)
    }
  }, [filteredData, dateRange, searchTerm, boletinNumber])

  // Función para volver al inicio
  const handleGoHome = useCallback(() => {
    router.push("/")
  }, [router])

  // Función para manejar el cambio en el rango de fechas
  const handleDateRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to })
  }, [])

  // Función para limpiar los filtros
  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }, [])

  // Función para cambiar el tamaño de página
  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(value === "all" ? "all" : Number.parseInt(value))
  }, [])

  // Función para ir a la página anterior
  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  // Función para ir a la página siguiente
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages()))
  }, [totalPages])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoHome} title="Volver al inicio">
              <Home className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Boletín Movimiento de Ganado</CardTitle>
              <p className="text-sm text-muted-foreground">Boletín No. {boletinNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              disabled={loading || !!error || filteredData().length === 0 || exporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={exportToPdf}
              disabled={loading || !!error || filteredData().length === 0 || exporting}
              className="bg-red-600 hover:bg-red-700"
            >
              <FilePdf className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por fecha, número de documento o entidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <DatePickerWithRange onRangeChange={handleDateRangeChange} className="w-full md:w-auto" />
            <Button variant="outline" onClick={clearFilters} title="Limpiar filtros">
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredData().length > 0 && (
                <>
                  {filteredData().length} registros
                  {dateRange.from && dateRange.to && (
                    <span className="ml-2">
                      • {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </span>
                  )}
                  {searchTerm && <span className="ml-2">• Búsqueda: {searchTerm}</span>}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="30 registros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 registros</SelectItem>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
        ) : filteredData().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron registros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Fecha</th>
                  <th className="border p-2 text-left">G/ Deguello</th>
                  <th className="border p-2 text-right">Cantidad</th>
                  <th className="border p-2 text-right">Cant. Machos</th>
                  <th className="border p-2 text-right">Cant. Hembras</th>
                  <th className="border p-2 text-right">Vr. Deguello</th>
                  <th className="border p-2 text-right">Ser. Matadero</th>
                  <th className="border p-2 text-center">Entidad</th>
                  <th className="border p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData().map((item, index) => (
                  <tr key={`item-${index}`} className="hover:bg-gray-50">
                    <td className="border p-2">{item.Fecha || "-"}</td>
                    <td className="border p-2">{item["G/ Deguello"] || "-"}</td>
                    <td className="border p-2 text-right">{item.Cantidad || "0"}</td>
                    <td className="border p-2 text-right">{item["Cantidad Machos"] || "0"}</td>
                    <td className="border p-2 text-right">{item["Cantidad Hembras"] || "0"}</td>
                    <td className="border p-2 text-right">{item["Vr Deguello"] || "0"}</td>
                    <td className="border p-2 text-right">{item["Ser. Matadero"] || "0"}</td>
                    <td className="border p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.Entidad === "Fedegan"
                            ? "bg-blue-100 text-blue-800"
                            : item.Entidad === "Porcicultura"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.Entidad || "Otro"}
                      </span>
                    </td>
                    <td className="border p-2 text-right">{item.Total || "0"}</td>
                  </tr>
                ))}

                {/* Fila de totales */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border p-2" colSpan={2}>
                    TOTALES
                  </td>
                  <td className="border p-2 text-right">{totales().cantidad.toLocaleString()}</td>
                  <td className="border p-2 text-right">{totales().cantidadMachos.toLocaleString()}</td>
                  <td className="border p-2 text-right">{totales().cantidadHembras.toLocaleString()}</td>
                  <td className="border p-2 text-right">
                    {totales().vrDeguello.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border p-2 text-right">
                    {totales().serMatadero.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2 text-right">
                    {totales().total.toLocaleString(undefined, {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Controles de paginación */}
        {!loading && !error && filteredData().length > 0 && pageSize !== "all" && totalPages() > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages()}>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
