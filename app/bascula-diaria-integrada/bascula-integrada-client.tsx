"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Filter, Home, FileText, FileSpreadsheet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format, isWithinInterval, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface BasculaItem {
  fecha: string
  tiquetes: string
  cantidad: string
  valor_unitario: string
  total: string
}

interface BasculaData {
  bovinos: BasculaItem[]
  porcinos: BasculaItem[]
}

interface CombinedItem {
  fecha: string
  // Bovinos (Ganado Mayor)
  tiquetesMay: string
  cantidadMay: string
  valorUnitarioMay: string
  totalMay: string
  // Porcinos (Ganado Menor)
  tiquetesMen: string
  cantidadMen: string
  valorUnitarioMen: string
  totalMen: string
}

export function BasculaIntegradaClient() {
  const [data, setData] = useState<BasculaData>({ bovinos: [], porcinos: [] })
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
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      let err = null
      try {
        setLoading(true)
        setError(null)
        setErrorDetails(null)

        // Intentar con la API principal primero
        const apiUrl = usingAltApi ? `/api/bascula-diaria-integrada-alt` : `/api/bascula-diaria-integrada`

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

        if (result.data && result.data.bovinos && result.data.porcinos) {
          setData({
            bovinos: result.data.bovinos,
            porcinos: result.data.porcinos,
          })
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

          console.error("Error al cargar datos de Báscula Diaria Integrada:", err)
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
    const filterItems = (items: BasculaItem[]) => {
      return items.filter((item) => {
        // Filtro por término de búsqueda
        const matchesSearchTerm = (item.fecha?.toLowerCase() || "").includes(searchTerm.toLowerCase())

        // Filtro por rango de fechas
        let matchesDateRange = true
        if (dateRange.from && dateRange.to) {
          try {
            // Convertir la fecha de string a objeto Date
            // El formato esperado es DD/MM/YYYY
            const itemDate = parse(item.fecha, "dd/MM/yyyy", new Date())

            matchesDateRange = isWithinInterval(itemDate, {
              start: dateRange.from,
              end: dateRange.to,
            })
          } catch (e) {
            console.error("Error al parsear fecha:", e, item.fecha)
            matchesDateRange = true // Si hay error, no filtrar por fecha
          }
        }

        return matchesSearchTerm && matchesDateRange
      })
    }

    return {
      bovinos: filterItems(data.bovinos),
      porcinos: filterItems(data.porcinos),
    }
  }, [data, searchTerm, dateRange])

  const combinedData = useCallback(() => {
    const filtered = filteredData()
    const combined: Record<string, CombinedItem> = {}

    // Procesar datos de bovinos
    filtered.bovinos.forEach((item) => {
      if (!combined[item.fecha]) {
        combined[item.fecha] = {
          fecha: item.fecha,
          tiquetesMay: item.tiquetes || "0",
          cantidadMay: item.cantidad || "0",
          valorUnitarioMay: item.valor_unitario || "0",
          totalMay: item.total || "0",
          tiquetesMen: "0",
          cantidadMen: "0",
          valorUnitarioMen: "0",
          totalMen: "0",
        }
      } else {
        combined[item.fecha].tiquetesMay = item.tiquetes || "0"
        combined[item.fecha].cantidadMay = item.cantidad || "0"
        combined[item.fecha].valorUnitarioMay = item.valor_unitario || "0"
        combined[item.fecha].totalMay = item.total || "0"
      }
    })

    // Procesar datos de porcinos
    filtered.porcinos.forEach((item) => {
      if (!combined[item.fecha]) {
        combined[item.fecha] = {
          fecha: item.fecha,
          tiquetesMay: "0",
          cantidadMay: "0",
          valorUnitarioMay: "0",
          totalMay: "0",
          tiquetesMen: item.tiquetes || "0",
          cantidadMen: item.cantidad || "0",
          valorUnitarioMen: item.valor_unitario || "0",
          totalMen: item.total || "0",
        }
      } else {
        combined[item.fecha].tiquetesMen = item.tiquetes || "0"
        combined[item.fecha].cantidadMen = item.cantidad || "0"
        combined[item.fecha].valorUnitarioMen = item.valor_unitario || "0"
        combined[item.fecha].totalMen = item.total || "0"
      }
    })

    // Convertir a array y ordenar por fecha (más reciente primero)
    return Object.values(combined).sort((a, b) => {
      const dateA = parse(a.fecha, "dd/MM/yyyy", new Date())
      const dateB = parse(b.fecha, "dd/MM/yyyy", new Date())
      return dateB.getTime() - dateA.getTime()
    })
  }, [filteredData])

  const paginatedData = useCallback(() => {
    const combined = combinedData()

    if (pageSize === "all") {
      return combined
    }

    const startIndex = (currentPage - 1) * (pageSize as number)
    return combined.slice(startIndex, startIndex + (pageSize as number))
  }, [combinedData, currentPage, pageSize])

  const totalPages = useCallback(() => {
    if (pageSize === "all") return 1

    const combined = combinedData()
    return Math.ceil(combined.length / (pageSize as number))
  }, [combinedData, pageSize])

  const totales = useCallback(() => {
    const combined = combinedData()
    return combined.reduce(
      (acc, item) => {
        // Bovinos
        acc.tiquetesMay += Number.parseInt(item.tiquetesMay?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadMay += Number.parseInt(item.cantidadMay?.replace(/,/g, "") || "0", 10) || 0
        acc.totalMay += Number.parseInt(item.totalMay?.replace(/,/g, "") || "0", 10) || 0

        // Porcinos
        acc.tiquetesMen += Number.parseInt(item.tiquetesMen?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadMen += Number.parseInt(item.cantidadMen?.replace(/,/g, "") || "0", 10) || 0
        acc.totalMen += Number.parseInt(item.totalMen?.replace(/,/g, "") || "0", 10) || 0

        return acc
      },
      {
        tiquetesMay: 0,
        cantidadMay: 0,
        totalMay: 0,
        tiquetesMen: 0,
        cantidadMen: 0,
        totalMen: 0,
      },
    )
  }, [combinedData])

  const valorUnitarioPromedio = useCallback(() => {
    const t = totales()
    return {
      may: t.tiquetesMay > 0 ? t.totalMay / t.tiquetesMay : 0,
      men: t.tiquetesMen > 0 ? t.totalMen / t.tiquetesMen : 0,
    }
  }, [totales])

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

  // Función para exportar a PDF
  const exportToPdf = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const dataToExport = combinedData()

      // Crear el objeto de datos para la API
      const exportData = {
        title: "BÁSCULA DIARIA INTEGRADA - BOVINOS Y PORCINOS",
        headers: [
          "Fecha",
          "Tiquetes G/May",
          "Cant",
          "Vr. Uni",
          "Total G/May",
          "Tiquetes G/Men",
          "Cant",
          "Vr. Uni",
          "Total G/Men",
        ],
        rows: dataToExport.map((item) => [
          item.fecha,
          item.tiquetesMay,
          item.cantidadMay,
          item.valorUnitarioMay,
          item.totalMay,
          item.tiquetesMen,
          item.cantidadMen,
          item.valorUnitarioMen,
          item.totalMen,
        ]),
        totals: [
          "TOTALES",
          totales().tiquetesMay.toString(),
          totales().cantidadMay.toString(),
          valorUnitarioPromedio().may.toFixed(0),
          totales().totalMay.toString(),
          totales().tiquetesMen.toString(),
          totales().cantidadMen.toString(),
          valorUnitarioPromedio().men.toFixed(0),
          totales().totalMen.toString(),
        ],
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : "Todos",
          searchTerm: searchTerm || "Ninguno",
        },
      }

      // Llamar a la API para generar el PDF
      const response = await fetch("/api/export/bascula-diaria-integrada/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`)
      }

      // Obtener el blob del PDF
      const blob = await response.blob()

      // Crear un URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace para descargar el archivo
      const a = document.createElement("a")
      a.href = url
      a.download = `bascula-diaria-integrada-${format(new Date(), "dd-MM-yyyy")}.pdf`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportación exitosa",
        description: "El PDF se ha generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setExporting(false)
    }
  }, [combinedData, dateRange, searchTerm, toast, totales, valorUnitarioPromedio])

  // Función para exportar a Excel
  const exportToExcel = useCallback(async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const dataToExport = combinedData()

      // Crear el objeto de datos para la API
      const exportData = {
        title: "BÁSCULA DIARIA INTEGRADA - BOVINOS Y PORCINOS",
        headers: [
          "Fecha",
          "Tiquetes G/May",
          "Cant",
          "Vr. Uni",
          "Total G/May",
          "Tiquetes G/Men",
          "Cant",
          "Vr. Uni",
          "Total G/Men",
        ],
        rows: dataToExport.map((item) => [
          item.fecha,
          item.tiquetesMay,
          item.cantidadMay,
          item.valorUnitarioMay,
          item.totalMay,
          item.tiquetesMen,
          item.cantidadMen,
          item.valorUnitarioMen,
          item.totalMen,
        ]),
        totals: [
          "TOTALES",
          totales().tiquetesMay.toString(),
          totales().cantidadMay.toString(),
          valorUnitarioPromedio().may.toFixed(0),
          totales().totalMay.toString(),
          totales().tiquetesMen.toString(),
          totales().cantidadMen.toString(),
          valorUnitarioPromedio().men.toFixed(0),
          totales().totalMen.toString(),
        ],
        filters: {
          dateRange:
            dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
              : "Todos",
          searchTerm: searchTerm || "Ninguno",
        },
      }

      // Llamar a la API para generar el Excel
      const response = await fetch("/api/export/bascula-diaria-integrada/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`)
      }

      // Obtener el blob del Excel
      const blob = await response.blob()

      // Crear un URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace para descargar el archivo
      const a = document.createElement("a")
      a.href = url
      a.download = `bascula-diaria-integrada-${format(new Date(), "dd-MM-yyyy")}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportación exitosa",
        description: "El Excel se ha generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setExporting(false)
    }
  }, [combinedData, dateRange, searchTerm, toast, totales, valorUnitarioPromedio])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoHome} title="Volver al inicio">
              <Home className="h-4 w-4" />
            </Button>
            <CardTitle>Báscula Diaria Integrada - Bovinos y Porcinos</CardTitle>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              disabled={loading || !!error || combinedData().length === 0 || exporting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={exportToPdf}
              disabled={loading || !!error || combinedData().length === 0 || exporting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por fecha..."
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
              {(filteredData().bovinos.length > 0 || filteredData().porcinos.length > 0) && (
                <>
                  Bovinos: {filteredData().bovinos.length} registros | Porcinos: {filteredData().porcinos.length}{" "}
                  registros
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
        ) : filteredData().bovinos.length === 0 && filteredData().porcinos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No se encontraron registros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left" rowSpan={2}>
                    Fecha
                  </th>
                  <th className="border p-2 text-center" colSpan={4}>
                    Ganado Mayor (Bovinos)
                  </th>
                  <th className="border p-2 text-center" colSpan={4}>
                    Ganado Menor (Porcinos)
                  </th>
                </tr>
                <tr className="bg-gray-100">
                  {/* Columnas Ganado Mayor */}
                  <th className="border p-2 text-right">Tiquetes G/May</th>
                  <th className="border p-2 text-right">Cant</th>
                  <th className="border p-2 text-right">Vr. Uni</th>
                  <th className="border p-2 text-right">Total G/May</th>

                  {/* Columnas Ganado Menor */}
                  <th className="border p-2 text-right">Tiquetes G/Men</th>
                  <th className="border p-2 text-right">Cant</th>
                  <th className="border p-2 text-right">Vr. Uni</th>
                  <th className="border p-2 text-right">Total G/Men</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData().map((item, index) => (
                  <tr key={`combined-${index}`} className="hover:bg-gray-50">
                    <td className="border p-2">{item.fecha || "-"}</td>

                    {/* Datos Ganado Mayor */}
                    <td className="border p-2 text-right">{item.tiquetesMay || "0"}</td>
                    <td className="border p-2 text-right">{item.cantidadMay || "0"}</td>
                    <td className="border p-2 text-right">{item.valorUnitarioMay || "0"}</td>
                    <td className="border p-2 text-right">{item.totalMay || "0"}</td>

                    {/* Datos Ganado Menor */}
                    <td className="border p-2 text-right">{item.tiquetesMen || "0"}</td>
                    <td className="border p-2 text-right">{item.cantidadMen || "0"}</td>
                    <td className="border p-2 text-right">{item.valorUnitarioMen || "0"}</td>
                    <td className="border p-2 text-right">{item.totalMen || "0"}</td>
                  </tr>
                ))}

                {/* Fila de totales */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="border p-2">TOTALES</td>

                  {/* Totales Ganado Mayor */}
                  <td className="border p-2 text-right">{totales().tiquetesMay.toLocaleString()}</td>
                  <td className="border p-2 text-right">{totales().cantidadMay.toLocaleString()}</td>
                  <td className="border p-2 text-right">
                    {valorUnitarioPromedio().may.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border p-2 text-right">
                    {totales().totalMay.toLocaleString(undefined, {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>

                  {/* Totales Ganado Menor */}
                  <td className="border p-2 text-right">{totales().tiquetesMen.toLocaleString()}</td>
                  <td className="border p-2 text-right">{totales().cantidadMen.toLocaleString()}</td>
                  <td className="border p-2 text-right">
                    {valorUnitarioPromedio().men.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border p-2 text-right">
                    {totales().totalMen.toLocaleString(undefined, {
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
        {!loading &&
          !error &&
          (filteredData().bovinos.length > 0 || filteredData().porcinos.length > 0) &&
          pageSize !== "all" &&
          totalPages() > 1 && (
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
