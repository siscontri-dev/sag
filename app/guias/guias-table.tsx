"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Filter, X, Eye, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import Link from "next/link"
import PrintTicketDialog from "@/components/print-ticket-dialog"

// Función directa para formatear fechas sin conversiones de zona horaria
function formatRawDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""

  // Si es formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-")
      return `${day}/${month}/${year}`
    }
  }

  // Si ya está en formato DD/MM/YYYY
  if (typeof dateStr === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr
  }

  // Para otros formatos, intentar convertir
  try {
    const date = new Date(dateStr)
    const day = String(date.getUTCDate()).padStart(2, "0")
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch (e) {
    console.error("Error al formatear fecha:", dateStr, e)
    return String(dateStr)
  }
}

// Función para parsear fechas para comparación
function parseToDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null

  try {
    // Si es formato DD/MM/YYYY
    if (typeof dateStr === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split("/").map(Number)
      return new Date(Date.UTC(year, month - 1, day))
    }

    // Si es formato ISO o cualquier otro formato válido
    return new Date(dateStr)
  } catch (e) {
    console.error("Error al parsear fecha:", dateStr, e)
    return null
  }
}

export default function GuiasTable({ guias = [], currentLimit = 30 }) {
  const [filteredGuias, setFilteredGuias] = useState(guias)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGuiaId, setSelectedGuiaId] = useState(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let result = [...guias]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (guia) =>
          (guia.dueno_anterior_nombre && guia.dueno_anterior_nombre.toLowerCase().includes(term)) ||
          (guia.dueno_anterior_nit && guia.dueno_anterior_nit.toLowerCase().includes(term)) ||
          (guia.dueno_nuevo_nombre && guia.dueno_nuevo_nombre.toLowerCase().includes(term)) ||
          (guia.dueno_nuevo_nit && guia.dueno_nuevo_nit.toLowerCase().includes(term)) ||
          (guia.numero_documento && guia.numero_documento.toLowerCase().includes(term)),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      result = result.filter((guia) => {
        const guiaDate = parseToDate(guia.fecha_documento)

        if (!guiaDate) return true

        if (dateRange.from && dateRange.to) {
          return guiaDate >= dateRange.from && guiaDate <= dateRange.to
        } else if (dateRange.from) {
          return guiaDate >= dateRange.from
        } else if (dateRange.to) {
          return guiaDate <= dateRange.to
        }

        return true
      })
    }

    setFilteredGuias(result)
  }, [guias, searchTerm, dateRange])

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  // Abrir diálogo de impresión
  const openPrintDialog = (guiaId) => {
    setSelectedGuiaId(guiaId)
    setIsPrintDialogOpen(true)
  }

  // Depurar fechas
  console.log(
    "Fechas originales de guías:",
    guias.map((g) => ({
      id: g.id,
      fecha_original: g.fecha_documento,
      fecha_formateada: formatRawDate(g.fecha_documento),
    })),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar guía, propietario, NIT..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="absolute right-2 top-2.5" onClick={() => setSearchTerm("")}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
            {(searchTerm || dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha desde:</label>
                  <DatePicker
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha hasta:</label>
                  <DatePicker selected={dateRange.to} onSelect={(date) => setDateRange({ ...dateRange, to: date })} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guía ICA</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Propietario Anterior</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Propietario Nuevo</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuias.length > 0 ? (
              filteredGuias.map((guia) => (
                <TableRow key={guia.id}>
                  <TableCell className="font-medium">{guia.numero_documento}</TableCell>
                  <TableCell>{formatRawDate(guia.fecha_documento)}</TableCell>
                  <TableCell>{guia.dueno_anterior_nombre}</TableCell>
                  <TableCell>{guia.dueno_anterior_nit}</TableCell>
                  <TableCell>{guia.dueno_nuevo_nombre}</TableCell>
                  <TableCell>{guia.dueno_nuevo_nit}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/guias/ver/${guia.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/guias/editar/${guia.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openPrintDialog(guia.id)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron guías con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredGuias.length} de {guias.length} guías
      </div>

      {/* Diálogo de impresión de tickets */}
      {isPrintDialogOpen && selectedGuiaId && (
        <PrintTicketDialog guiaId={selectedGuiaId} open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} />
      )}
    </div>
  )
}
