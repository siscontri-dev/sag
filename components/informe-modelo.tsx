"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Filter, Home, FileSpreadsheet, FileText, FileIcon as FilePdf, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Definición de tipos para las columnas
export interface ColumnaInforme {
  id: string // ID único para la columna
  header: string // Texto del encabezado
  accessor: string // Propiedad para acceder al valor en los datos
  align?: "left" | "right" | "center" // Alineación del texto
  isNumeric?: boolean // Si es una columna numérica
  format?: (value: any) => string // Función opcional para formatear el valor
}

// Definición de tipos para las opciones de exportación
export interface OpcionesExportacion {
  tituloDocumento: string // Título principal para documentos exportados
  subtituloDocumento: string // Subtítulo para documentos exportados
  nombreArchivo: string // Nombre base para los archivos exportados
}

// Definición de tipos para las propiedades del componente
export interface InformeModeloProps {
  titulo: string // Título del informe en la UI
  endpoint: string // Endpoint de API para obtener los datos
  columnas: ColumnaInforme[] // Definición de columnas
  opcionesExportacion: OpcionesExportacion // Opciones para exportación
  accionesPersonalizadas?: React.ReactNode // Acciones personalizadas opcionales
  mostrarBusqueda?: boolean // Si se debe mostrar el campo de búsqueda
  mostrarFiltroFecha?: boolean // Si se debe mostrar el filtro de fecha
  rutaInicio?: string // Ruta para el botón de inicio
  rutaNuevo?: string // Ruta para el botón de nuevo
  mostrarBotonNuevo?: boolean // Si se debe mostrar el botón de nuevo
  filtrosAdicionales?: React.ReactNode // Filtros adicionales opcionales
  mostrarTotales?: boolean
  mostrarAlertaDatosEjemplo?: boolean // Nueva propiedad para controlar si se muestra la alerta
}

export function InformeModelo({
  titulo,
  endpoint,
  columnas,
  opcionesExportacion,
  accionesPersonalizadas,
  mostrarBusqueda = true,
  mostrarFiltroFecha = true,
  rutaInicio = "/",
  rutaNuevo,
  mostrarBotonNuevo = false,
  filtrosAdicionales,
  mostrarTotales = false,
  mostrarAlertaDatosEjemplo = false, // Por defecto, no mostrar la alerta
}: InformeModeloProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [pageSize, setPageSize] = useState<number | "all">(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const [totals, setTotals] = useState<Record<string, any> | null>(null)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState<number>(0)
  const [usingSampleData, setUsingSampleData] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Función para cargar los datos
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setErrorDetails(null)
    setUsingSampleData(false)

    try {
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append("search", searchTerm)
      if (dateRange?.from) queryParams.append("startDate", format(dateRange.from, "yyyy-MM-dd"))
      if (dateRange?.to) queryParams.append("endDate", format(dateRange.to, "yyyy-MM-dd"))

      console.log(`Fetching data from: ${endpoint}?${queryParams.toString()}`)

      // Agregar un parámetro de caché para evitar problemas de caché
      queryParams.append("_cache", Date.now().toString())

      const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        let errorText = "Error del servidor"
        try {
          errorText = await response.text()
          console.error(`Error response (${response.status}):`, errorText)
        } catch (e) {
          console.error(`Error al leer la respuesta de error:`, e)
        }

        throw new Error(`Error: ${response.status} - ${errorText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Respuesta no es JSON:", contentType)
        throw new Error(`Respuesta inesperada del servidor: ${contentType || "desconocido"}`)
      }

      let result
      try {
        result = await response.json()
      } catch (e) {
        console.error("Error al parsear JSON:", e)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      if (!result || !Array.isArray(result.data)) {
        console.error("Respuesta sin datos válidos:", result)
        throw new Error("La respuesta del servidor no contiene datos válidos")
      }

      setData(result.data || [])
      setTotals(result.totals || null)
      setFilteredData(result.data || [])
      setTotalItems(result.data?.length || 0)

      // Verificar si se están usando datos de ejemplo
      if (result.usingSampleData) {
        setUsingSampleData(result.usingSampleData)
      }

      // Verificar si hay un error en la respuesta
      if (result.error) {
        setErrorDetails(result.error)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Error desconocido al cargar los datos")

      // Si hay un error, intentar usar datos de ejemplo locales
      try {
        // Datos de ejemplo locales como respaldo
        const localSampleData = [
          {
            Fecha: "2023-05-01",
            "Del (Primer Ticket ID)": 1001,
            "Al (Último Ticket ID)": 1050,
            Tiquetes: 50,
            "Nº Machos": "35",
            "Nº Hembras": "15",
            "Peso (Kg)": "12,500",
            "Valor Servicio Unitario": "25,000",
            "Total Valor Servicio": "1,250,000",
          },
          {
            Fecha: "2023-05-02",
            "Del (Primer Ticket ID)": 1051,
            "Al (Último Ticket ID)": 1090,
            Tiquetes: 40,
            "Nº Machos": "28",
            "Nº Hembras": "12",
            "Peso (Kg)": "10,800",
            "Valor Servicio Unitario": "25,000",
            "Total Valor Servicio": "1,000,000",
          },
          {
            Fecha: "2023-05-03",
            "Del (Primer Ticket ID)": 1091,
            "Al (Último Ticket ID)": 1140,
            Tiquetes: 50,
            "Nº Machos": "32",
            "Nº Hembras": "18",
            "Peso (Kg)": "13,200",
            "Valor Servicio Unitario": "25,000",
            "Total Valor Servicio": "1,250,000",
          },
        ]

        setData(localSampleData)
        setFilteredData(localSampleData)
        setTotalItems(localSampleData.length)
        setUsingSampleData(true)
        setErrorDetails("Usando datos de ejemplo locales debido a un error de conexión")
      } catch (fallbackError) {
        console.error("Error al usar datos de ejemplo locales:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, searchTerm, dateRange, retryCount])

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Cuando cambia el filtro o el tamaño de página, volver a la primera página
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateRange, pageSize])

  // Filtrar datos según el término de búsqueda
  const filteredDataMemo = useCallback(() => {
    if (!mostrarBusqueda || !searchTerm || !data || data.length === 0) return data || []

    return data.filter((item) => {
      // Buscar en todas las propiedades de texto
      return Object.entries(item).some(([key, value]) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        }
        return false
      })
    })
  }, [data, searchTerm, mostrarBusqueda])

  // Calcular datos paginados
  const paginatedData = useCallback(() => {
    const filtered = filteredDataMemo() || []

    if (pageSize === "all" || !filtered || filtered.length === 0) {
      return filtered
    }

    const startIndex = (currentPage - 1) * (pageSize as number)
    return filtered.slice(startIndex, startIndex + (pageSize as number))
  }, [filteredDataMemo, currentPage, pageSize])

  // Calcular el número total de páginas
  const totalPages = useCallback(() => {
    if (pageSize === "all") return 1
    const filtered = filteredDataMemo() || []
    return Math.max(1, Math.ceil(filtered.length / (pageSize as number)))
  }, [filteredDataMemo, pageSize])

  // Función para exportar a CSV
  const exportToCsv = useCallback(() => {
    try {
      setExporting(true)

      // Crear un array con los encabezados
      const headers = columnas.map((col) => col.header)

      // Crear filas de datos
      const rows = filteredDataMemo().map((item) =>
        columnas.map((col) => {
          const value = item[col.accessor]
          return col.format && value !== undefined ? col.format(value) : value || ""
        }),
      )

      // Crear título con información de filtros
      const title = opcionesExportacion.tituloDocumento
      let subtitle = opcionesExportacion.subtituloDocumento

      if (dateRange.from && dateRange.to) {
        subtitle += ` (${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")})`
      }

      if (searchTerm) {
        subtitle += ` - Búsqueda: ${searchTerm}`
      }

      // Agregar títulos como primeras filas
      rows.unshift([""], [subtitle, "", "", "", "", "", "", "", ""])
      rows.unshift([title, "", "", "", "", "", "", "", ""])

      // Combinar encabezados y filas
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [[""], headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      // Crear un enlace de descarga
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute(
        "download",
        `${opcionesExportacion.nombreArchivo}_${new Date().toISOString().split("T")[0]}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al exportar a CSV:", error)
      alert("Error al exportar a CSV. Por favor, intente nuevamente.")
    } finally {
      setExporting(false)
    }
  }, [filteredDataMemo, columnas, opcionesExportacion, dateRange, searchTerm])

  // Función para exportar a Excel
  const exportToExcel = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const exportData = {
        title: opcionesExportacion.tituloDocumento,
        subtitle: opcionesExportacion.subtituloDocumento,
        headers: columnas.map((col) => col.header),
        columns: columnas.map((col) => ({
          id: col.id,
          header: col.header,
          accessor: col.accessor,
          align: col.align || "left",
          isNumeric: col.isNumeric || false,
        })),
        rows: filteredDataMemo(),
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : null,
          searchTerm: searchTerm || null,
        },
      }

      // Llamar a la API para generar el Excel
      const response = await fetch(`/api/export/informe/excel`, {
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
      link.setAttribute(
        "download",
        `${opcionesExportacion.nombreArchivo}_${new Date().toISOString().split("T")[0]}.xlsx`,
      )
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
  }, [filteredDataMemo, columnas, opcionesExportacion, dateRange, searchTerm])

  // Función para exportar a PDF
  const exportToPdf = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const exportData = {
        title: opcionesExportacion.tituloDocumento,
        subtitle: opcionesExportacion.subtituloDocumento,
        headers: columnas.map((col) => col.header),
        columns: columnas.map((col) => ({
          id: col.id,
          header: col.header,
          accessor: col.accessor,
          align: col.align || "left",
          isNumeric: col.isNumeric || false,
        })),
        rows: filteredDataMemo(),
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : null,
          searchTerm: searchTerm || null,
        },
      }

      // Llamar a la API para generar el PDF
      const response = await fetch(`/api/export/informe/pdf`, {
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
      link.setAttribute(
        "download",
        `${opcionesExportacion.nombreArchivo}_${new Date().toISOString().split("T")[0]}.pdf`,
      )
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
  }, [filteredDataMemo, columnas, opcionesExportacion, dateRange, searchTerm])

  // Función para volver al inicio
  const handleGoHome = useCallback(() => {
    router.push(rutaInicio)
  }, [router, rutaInicio])

  // Función para ir a la página de nuevo registro
  const handleNew = useCallback(() => {
    if (rutaNuevo) {
      router.push(rutaNuevo)
    }
  }, [router, rutaNuevo])

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

  // Función para reintentar la carga de datos
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1)
  }, [])

  // Obtener el valor de una celda
  const getCellValue = useCallback((item: any, column: ColumnaInforme) => {
    const value = item[column.accessor]
    if (value === undefined || value === null) return "-"
    return column.format ? column.format(value) : value
  }, [])

  const currentItems = paginatedData()

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoHome} title="Volver al inicio">
              <Home className="h-4 w-4" />
            </Button>
            <CardTitle>{titulo}</CardTitle>
          </div>
          <div className="flex gap-2">
            {mostrarBotonNuevo && rutaNuevo && (
              <Button onClick={handleNew} variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            )}
            <Button
              onClick={exportToCsv}
              disabled={loading || filteredDataMemo().length === 0 || exporting}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={loading || filteredDataMemo().length === 0 || exporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={exportToPdf}
              disabled={loading || filteredDataMemo().length === 0 || exporting}
              className="bg-red-600 hover:bg-red-700"
            >
              <FilePdf className="mr-2 h-4 w-4" />
              PDF
            </Button>
            {accionesPersonalizadas}
          </div>
        </div>

        {/* Alerta de datos de ejemplo - ahora controlada por la prop mostrarAlertaDatosEjemplo */}
        {usingSampleData && mostrarAlertaDatosEjemplo && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Usando datos de ejemplo</AlertTitle>
            <AlertDescription>
              No se pudo conectar a la base de datos. Se están mostrando datos de ejemplo para fines de demostración. En
              producción, este informe mostrará datos reales.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {mostrarBusqueda && (
              <div className="flex-1">
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            {mostrarFiltroFecha && (
              <DatePickerWithRange onRangeChange={handleDateRangeChange} className="w-full md:w-auto" />
            )}
            {(mostrarBusqueda || mostrarFiltroFecha) && (
              <Button variant="outline" onClick={clearFilters} title="Limpiar filtros">
                <Filter className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
            {filtrosAdicionales}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredDataMemo().length > 0 && (
                <>
                  {filteredDataMemo().length} registros encontrados
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
                <Button onClick={handleRetry} variant="outline" className="mt-4 ml-2">
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

            {/* Mostrar datos de ejemplo incluso si hay un error */}
            {data && data.length > 0 && (
              <div className="mt-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Mostrando datos disponibles</AlertTitle>
                  <AlertDescription>
                    A pesar del error, se están mostrando algunos datos que pudieron ser recuperados.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        ) : filteredDataMemo().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron registros.</p>
          </div>
        ) : null}

        {/* Tabla de datos - siempre mostrar si hay datos, incluso si hay un error */}
        {!loading && filteredDataMemo().length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columnas.map((columna) => (
                      <TableHead key={columna.id} className={columna.isNumeric ? "text-right" : ""}>
                        {columna.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnas.length} className="h-24 text-center">
                        {loading ? (
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Cargando datos...</span>
                          </div>
                        ) : error ? (
                          <div className="text-red-500">{error}</div>
                        ) : (
                          "No se encontraron registros."
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((item, index) => (
                      <TableRow key={index}>
                        {columnas.map((columna) => (
                          <TableCell key={`${index}-${columna.id}`} className={columna.isNumeric ? "text-right" : ""}>
                            {item[columna.accessor] || ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}

                  {/* Fila de totales */}
                  {mostrarTotales && totals && (
                    <TableRow className="font-bold bg-gray-100">
                      {columnas.map((columna) => (
                        <TableCell key={`totals-${columna.id}`} className={columna.isNumeric ? "text-right" : ""}>
                          {totals[columna.accessor] || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Controles de paginación */}
            {pageSize !== "all" && totalPages() > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * (pageSize as number) + 1} a{" "}
                  {Math.min(currentPage * (pageSize as number), filteredDataMemo().length)} de{" "}
                  {filteredDataMemo().length} registros
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
