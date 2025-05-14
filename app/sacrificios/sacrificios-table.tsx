"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Filter, X, Eye, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import PrintSacrificioDialog from "@/components/print-sacrificio-dialog"

export default function SacrificiosTable({ sacrificios = [], currentLimit = 30 }) {
  const [filteredSacrificios, setFilteredSacrificios] = useState(sacrificios)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSacrificioId, setSelectedSacrificioId] = useState(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let result = [...sacrificios]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (sacrificio) =>
          (sacrificio.dueno_anterior_nombre && sacrificio.dueno_anterior_nombre.toLowerCase().includes(term)) ||
          (sacrificio.dueno_anterior_nit && sacrificio.dueno_anterior_nit.toLowerCase().includes(term)) ||
          (sacrificio.numero_documento && sacrificio.numero_documento.toLowerCase().includes(term)) ||
          (sacrificio.fecha_documento && sacrificio.fecha_documento.toLowerCase().includes(term)),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      result = result.filter((sacrificio) => {
        if (!sacrificio.fecha_documento) return true

        // Convertir la fecha del sacrificio a formato DD/MM/YYYY para comparación
        const sacrificioDateParts = sacrificio.fecha_documento.split("/")
        if (sacrificioDateParts.length !== 3) return true

        const sacrificioDate = new Date(
          Number.parseInt(sacrificioDateParts[2]), // año
          Number.parseInt(sacrificioDateParts[1]) - 1, // mes (0-11)
          Number.parseInt(sacrificioDateParts[0]), // día
        )

        if (dateRange.from && dateRange.to) {
          return sacrificioDate >= dateRange.from && sacrificioDate <= dateRange.to
        } else if (dateRange.from) {
          return sacrificioDate >= dateRange.from
        } else if (dateRange.to) {
          return sacrificioDate <= dateRange.to
        }

        return true
      })
    }

    setFilteredSacrificios(result)
  }, [sacrificios, searchTerm, dateRange])

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  // Abrir diálogo de impresión
  const openPrintDialog = (sacrificioId) => {
    setSelectedSacrificioId(sacrificioId)
    setIsPrintDialogOpen(true)
  }

  // Depurar fechas
  console.log(
    "Fechas originales de sacrificios:",
    sacrificios.map((s) => ({
      id: s.id,
      fecha_original: s.fecha_documento,
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
                placeholder="Buscar sacrificio, propietario, NIT..."
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
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Machos</TableHead>
              <TableHead>Hembras</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSacrificios.length > 0 ? (
              filteredSacrificios.map((sacrificio) => (
                <TableRow key={sacrificio.id}>
                  <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                  <TableCell>{sacrificio.fecha_documento}</TableCell>
                  <TableCell>{sacrificio.dueno_anterior_nombre}</TableCell>
                  <TableCell>{sacrificio.dueno_anterior_nit}</TableCell>
                  <TableCell>{sacrificio.quantity_m || 0}</TableCell>
                  <TableCell>{sacrificio.quantity_h || 0}</TableCell>
                  <TableCell>{(sacrificio.quantity_m || 0) + (sacrificio.quantity_h || 0)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sacrificio.estado === "confirmado"
                          ? "success"
                          : sacrificio.estado === "anulado"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {sacrificio.estado === "confirmado"
                        ? "Confirmado"
                        : sacrificio.estado === "anulado"
                          ? "Anulado"
                          : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(sacrificio.total)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/sacrificios/ver/${sacrificio.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/sacrificios/editar/${sacrificio.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openPrintDialog(sacrificio.id)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No se encontraron sacrificios con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredSacrificios.length} de {sacrificios.length} sacrificios
      </div>

      {/* Diálogo de impresión de sacrificios */}
      {isPrintDialogOpen && selectedSacrificioId && (
        <PrintSacrificioDialog
          sacrificioId={selectedSacrificioId}
          open={isPrintDialogOpen}
          onOpenChange={setIsPrintDialogOpen}
        />
      )}
    </div>
  )
}
