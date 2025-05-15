"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Filter, Home, FileSpreadsheet, FileText, FileIcon as FilePdf } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format, isWithinInterval, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BasculaItem {
  Fecha: string
  "Del (Primer Ticket ID)": string
  "Al (Último Ticket ID)": string
  Tiquetes: string
  "Nº Machos": string
  "Nº Hembras": string
  "Peso (Kg)": string
  "Valor Servicio Unitario": string
  "Total Valor Servicio": string
}

export function BasculaClient() {
  const [data, setData] = useState<BasculaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [usingAltApi, setUsingAltApi] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [pageSize, setPageSize] = useState<number | "all">(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      let err = null
      try {
        setLoading(true)
        setError(null)
        setErrorDetails(null)

        // Intentar con la API principal primero
        const apiUrl = usingAltApi ? `/api/bascula-diaria-alt` : `/api/bascula-diaria`

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

          console.error("Error al cargar datos de Báscula Diaria:", err)
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
  const filteredData = data.filter((item) => {
    // Filtro por término de búsqueda
    const matchesSearchTerm =
      (item.Fecha?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item["Del (Primer Ticket ID)"]?.toString() || "").includes(searchTerm) ||
      (item["Al (Último Ticket ID)"]?.toString() || "").includes(searchTerm)

    // Filtro por rango de fechas
    let matchesDateRange = true
    if (dateRange.from && dateRange.to) {
      try {
        // Convertir la fecha de string a objeto Date
        // El formato esperado ahora es DD/MM/YYYY
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

  // Calcular datos paginados
  const paginatedData = useCallback(() => {
    if (pageSize === "all") {
      return filteredData
    }

    const startIndex = (currentPage - 1) * (pageSize as number)
    return filteredData.slice(startIndex, startIndex + (pageSize as number))
  }, [filteredData, currentPage, pageSize])

  // Calcular el número total de páginas
  const totalPages = useCallback(() => {
    if (pageSize === "all") return 1
    return Math.ceil(filteredData.length / (pageSize as number))
  }, [filteredData.length, pageSize])

  // Función para exportar a CSV - Usamos useCallback para evitar recreaciones innecesarias
  const exportToCsv = useCallback(() => {
    try {
      setExporting(true)
      // Crear un array con los encabezados
      const headers = [
        "Fecha",
        "Del (Primer Ticket ID)",
        "Al (Último Ticket ID)",
        "Tiquetes",
        "Nº Machos",
        "Nº Hembras",
        "Peso (Kg)",
        "Valor Servicio Unitario",
        "Total Valor Servicio",
      ]

      // Crear filas de datos - Exportamos TODOS los datos filtrados, no solo la página actual
      const rows = filteredData.map((item) => [
        item.Fecha || "",
        item["Del (Primer Ticket ID)"] || "",
        item["Al (Último Ticket ID)"] || "",
        item.Tiquetes || "",
        item["Nº Machos"] || "",
        item["Nº Hembras"] || "",
        item["Peso (Kg)"] || "",
        item["Valor Servicio Unitario"] || "",
        item["Total Valor Servicio"] || "",
      ])

      // Crear título con información de filtros
      let title = "Báscula Diaria - Porcinos"
      if (dateRange.from && dateRange.to) {
        title += ` (${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")})`
      }
      if (searchTerm) {
        title += ` - Búsqueda: ${searchTerm}`
      }

      // Agregar título como primera fila
      rows.unshift([title, "", "", "", "", "", "", "", ""])

      // Combinar encabezados y filas
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [[""], headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      // Crear un enlace de descarga
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `bascula_diaria_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al exportar a CSV:", error)
      alert("Error al exportar a CSV. Por favor, intente nuevamente.")
    } finally {
      setExporting(false)
    }
  }, [filteredData, dateRange, searchTerm])

  // Función para exportar a Excel (XLSX)
  const exportToExcel = useCallback(async () => {
    try {
      setExporting(true)

      // Crear título con información de filtros
      let title = "Báscula Diaria - Porcinos"
      if (dateRange.from && dateRange.to) {
        title += ` (${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")})`
      }
      if (searchTerm) {
        title += ` - Búsqueda: ${searchTerm}`
      }

      // Preparar los datos para la API
      const exportData = {
        title,
        headers: [
          "Fecha",
          "Del (Primer Ticket ID)",
          "Al (Último Ticket ID)",
          "Tiquetes",
          "Nº Machos",
          "Nº Hembras",
          "Peso (Kg)",
          "Valor Servicio Unitario",
          "Total Valor Servicio",
        ],
        rows: filteredData.map((item) => ({
          fecha: item.Fecha || "",
          delTicket: item["Del (Primer Ticket ID)"] || "",
          alTicket: item["Al (Último Ticket ID)"] || "",
          tiquetes: item.Tiquetes || "0",
          machos: item["Nº Machos"] || "0",
          hembras: item["Nº Hembras"] || "0",
          peso: item["Peso (Kg)"] || "0",
          valorUnitario: item["Valor Servicio Unitario"] || "0",
          totalValor: item["Total Valor Servicio"] || "0",
        })),
      }

      // Llamar a la API para generar el Excel
      const response = await fetch(`/api/export/bascula-diaria/excel`, {
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
      link.setAttribute("download", `bascula_diaria_${new Date().toISOString().split("T")[0]}.xlsx`)
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
  }, [filteredData, dateRange, searchTerm])

  // Función para exportar a PDF
  const exportToPdf = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const exportData = {
        title: "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA\nBáscula Diaria - Porcinos",
        headers: [
          "Fecha",
          "Del (Primer Ticket ID)",
          "Al (Último Ticket ID)",
          "Tiquetes",
          "Nº Machos",
          "Nº Hembras",
          "Peso (Kg)",
          "Valor Servicio Unitario",
          "Total Valor Servicio",
        ],
        rows: filteredData.map((item) => ({
          fecha: item.Fecha || "",
          delTicket: item["Del (Primer Ticket ID)"] || "",
          alTicket: item["Al (Último Ticket ID)"] || "",
          tiquetes: item.Tiquetes || "0",
          machos: item["Nº Machos"] || "0",
          hembras: item["Nº Hembras"] || "0",
          peso: item["Peso (Kg)"] || "0",
          valorUnitario: item["Valor Servicio Unitario"] || "0",
          totalValor: item["Total Valor Servicio"] || "0",
        })),
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : null,
          searchTerm: searchTerm || null,
        },
      }

      // Llamar a la API para generar el PDF
      const response = await fetch(`/api/export/bascula-diaria/pdf`, {
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
      link.setAttribute("download", `bascula_diaria_${new Date().toISOString().split("T")[0]}.pdf`)
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
  }, [filteredData, dateRange, searchTerm])

  // Función para volver al inicio - Usamos useCallback
  const handleGoHome = useCallback(() => {
    router.push("/")
  }, [router])

  // Función para manejar el cambio en el rango de fechas - Usamos useCallback
  const handleDateRangeChange = useCallback((from: Date, to: Date) => {
    setDateRange({ from, to })
  }, [])

  // Función para limpiar los filtros - Usamos useCallback
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

  // Calcular totales
  const totales = filteredData.reduce(
    (acc, item) => {
      acc.tiquetes += Number.parseInt(item.Tiquetes || "0", 10) || 0
      acc.machos += Number.parseInt(item["Nº Machos"]?.replace(/,/g, "") || "0", 10) || 0
      acc.hembras += Number.parseInt(item["Nº Hembras"]?.replace(/,/g, "") || "0", 10) || 0
      acc.peso += Number.parseInt(item["Peso (Kg)"]?.replace(/,/g, "") || "0", 10) || 0
      acc.totalValor += Number.parseInt(item["Total Valor Servicio"]?.replace(/,/g, "") || "0", 10) || 0
      return acc
    },
    {
      tiquetes: 0,
      machos: 0,
      hembras: 0,
      peso: 0,
      totalValor: 0,
    },
  )

  // Calcular valor unitario promedio
  const valorUnitarioPromedio = totales.tiquetes > 0 ? totales.totalValor / totales.tiquetes : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoHome} title="Volver al inicio">
              <Home className="h-4 w-4" />
            </Button>
            <CardTitle>Báscula Diaria - Porcinos</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToCsv}
              disabled={loading || !!error || filteredData.length === 0 || exporting}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={loading || !!error || filteredData.length === 0 || exporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={exportToPdf}
              disabled={loading || !!error || filteredData.length === 0 || exporting}
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
                placeholder="Buscar por fecha o número de ticket..."
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
              {filteredData.length > 0 && (
                <>
                  {filteredData.length} registros encontrados
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
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron registros.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Fecha</th>
                    <th className="border p-2 text-right">Del (Primer Ticket ID)</th>
                    <th className="border p-2 text-right">Al (Último Ticket ID)</th>
                    <th className="border p-2 text-right">Tiquetes</th>
                    <th className="border p-2 text-right">Nº Machos</th>
                    <th className="border p-2 text-right">Nº Hembras</th>
                    <th className="border p-2 text-right">Peso (Kg)</th>
                    <th className="border p-2 text-right">Valor Servicio Unitario</th>
                    <th className="border p-2 text-right">Total Valor Servicio</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2">{item.Fecha || "-"}</td>
                      <td className="border p-2 text-right">{item["Del (Primer Ticket ID)"] || "-"}</td>
                      <td className="border p-2 text-right">{item["Al (Último Ticket ID)"] || "-"}</td>
                      <td className="border p-2 text-right">{item.Tiquetes || "0"}</td>
                      <td className="border p-2 text-right">{item["Nº Machos"] || "0"}</td>
                      <td className="border p-2 text-right">{item["Nº Hembras"] || "0"}</td>
                      <td className="border p-2 text-right">{item["Peso (Kg)"] || "0"}</td>
                      <td className="border p-2 text-right">{item["Valor Servicio Unitario"] || "0"}</td>
                      <td className="border p-2 text-right">{item["Total Valor Servicio"] || "0"}</td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border p-2" colSpan={3}>
                      TOTALES
                    </td>
                    <td className="border p-2 text-right">{totales.tiquetes.toLocaleString()}</td>
                    <td className="border p-2 text-right">{totales.machos.toLocaleString()}</td>
                    <td className="border p-2 text-right">{totales.hembras.toLocaleString()}</td>
                    <td className="border p-2 text-right">{totales.peso.toLocaleString()}</td>
                    <td className="border p-2 text-right">
                      {valorUnitarioPromedio.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="border p-2 text-right">
                      {totales.totalValor.toLocaleString(undefined, {
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

            {/* Controles de paginación */}
            {pageSize !== "all" && totalPages() > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * (pageSize as number) + 1} a{" "}
                  {Math.min(currentPage * (pageSize as number), filteredData.length)} de {filteredData.length} registros
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                    Anterior
                  </Button>
                  <div className="flex items-center px-2">
                    <span className="text-sm">
                      Página {currentPage} de {totalPages()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages()}>
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
