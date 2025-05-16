"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Filter, Home, FileText, FileSpreadsheet, PlusCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { format, isWithinInterval, parse } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

interface BoletinItem {
  Fecha: string
  "G/ Deguello": string
  Cantidad: string
  "Cantidad Machos": string
  "Cantidad Hembras": string
  "Vr Deguello": string
  "Ser. Matadero": string
  Porcicultura: string
  Total: string
}

export function BoletinPorcinosClient() {
  const [data, setData] = useState<BoletinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })
  const [pageSize, setPageSize] = useState<number | "all">(30)
  const [currentPage, setCurrentPage] = useState(1)
  const [boletinNumber, setBoletinNumber] = useState("")
  const [exporting, setExporting] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Generar número de boletín basado en la fecha actual
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    setBoletinNumber(`BOL-P-${year}${month}${day}`)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setErrorDetails(null)

        const response = await fetch(`/api/boletin-movimiento-porcinos`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error al cargar datos: ${response.status}`)
        }

        if (result.data) {
          setData(result.data)
        } else {
          throw new Error("Formato de datos inesperado")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Error desconocido")

        // Intentar obtener más detalles del error
        if (error instanceof Error) {
          setErrorDetails(error.stack || "No hay detalles adicionales disponibles")
        }

        console.error("Error al cargar datos del Boletín Movimiento de Porcinos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
        (item["G/ Deguello"]?.toLowerCase() || "").includes(searchTerm.toLowerCase())

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

  const [currentItems, setCurrentItems] = useState<BoletinItem[]>([])

  useEffect(() => {
    const startIndex = (currentPage - 1) * (pageSize === "all" ? 0 : Number(pageSize))
    const endIndex = pageSize === "all" ? filteredData().length : startIndex + Number(pageSize)
    setCurrentItems(filteredData().slice(startIndex, endIndex))
  }, [currentPage, pageSize, filteredData])

  const totals = useMemo(() => {
    if (!data || data.length === 0) return null

    return data.reduce(
      (acc, item) => {
        acc.cantidad += Number.parseInt(item.Cantidad.replace(/,/g, "") || "0")
        acc.cantidadMachos += Number.parseInt(item["Cantidad Machos"].replace(/,/g, "") || "0")
        acc.cantidadHembras += Number.parseInt(item["Cantidad Hembras"].replace(/,/g, "") || "0")
        acc.vrDeguello += Number.parseInt(item["Vr Deguello"].replace(/,/g, "") || "0")
        acc.serMatadero += Number.parseInt(item["Ser. Matadero"].replace(/,/g, "") || "0")
        acc.porcicultura += Number.parseInt(item.Porcicultura.replace(/,/g, "") || "0")
        acc.total += Number.parseInt(item.Total.replace(/,/g, "") || "0")
        return acc
      },
      {
        cantidad: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        vrDeguello: 0,
        serMatadero: 0,
        porcicultura: 0,
        total: 0,
      },
    )
  }, [data])

  // Función para exportar a PDF
  const exportToPdf = async () => {
    try {
      setExporting(true)

      // Preparar los datos para la API
      const exportData = {
        title: "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA\nBOLETÍN MOVIMIENTO DE PORCINOS",
        data: filteredData(),
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
      const response = await fetch("/api/export/boletin-movimiento-porcinos/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error al generar PDF: ${response.status}`)
      }

      // Obtener el blob del PDF
      const blob = await response.blob()

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `boletin_movimiento_porcinos_${boletinNumber}.pdf`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF generado correctamente",
        description: "El archivo se ha descargado.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "Error desconocido",
        duration: 5000,
      })
    } finally {
      setExporting(false)
    }
  }

  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      setExportingExcel(true)

      // Preparar los datos para la API
      const exportData = {
        title: "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA\nBOLETÍN MOVIMIENTO DE PORCINOS",
        data: filteredData(),
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
      const response = await fetch("/api/export/boletin-movimiento-porcinos/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error al generar Excel: ${response.status}`)
      }

      // Obtener el blob del Excel
      const blob = await response.blob()

      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `boletin_movimiento_porcinos_${boletinNumber}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Excel generado correctamente",
        description: "El archivo se ha descargado.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: error instanceof Error ? error.message : "Error desconocido",
        duration: 5000,
      })
    } finally {
      setExportingExcel(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoHome} title="Volver al inicio">
              <Home className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Boletín Movimiento de Porcinos</CardTitle>
              <p className="text-sm text-muted-foreground">Boletín No. {boletinNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/guias/nueva?tipo=porcino")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía
            </Button>
            <Button
              onClick={exportToExcel}
              disabled={loading || !!error || filteredData().length === 0 || exportingExcel}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={exportToPdf}
              disabled={loading || !!error || filteredData().length === 0 || exporting}
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
                placeholder="Buscar por fecha o número de documento..."
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>G/ Deguello</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Cantidad Machos</TableHead>
                  <TableHead>Cantidad Hembras</TableHead>
                  <TableHead>Vr Deguello</TableHead>
                  <TableHead>Ser. Matadero</TableHead>
                  <TableHead>Porcicultura</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.Fecha}</TableCell>
                    <TableCell>{item["G/ Deguello"]}</TableCell>
                    <TableCell>{item.Cantidad}</TableCell>
                    <TableCell>{item["Cantidad Machos"]}</TableCell>
                    <TableCell>{item["Cantidad Hembras"]}</TableCell>
                    <TableCell>{item["Vr Deguello"]}</TableCell>
                    <TableCell>{item["Ser. Matadero"]}</TableCell>
                    <TableCell>{item.Porcicultura}</TableCell>
                    <TableCell>{item.Total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
