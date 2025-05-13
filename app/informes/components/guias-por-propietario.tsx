"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Filter, X, ChevronDown, ChevronRight } from "lucide-react"
import { formatDisplayDate, parseToDate } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"

export default function GuiasPorPropietario({ guias = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [showFilters, setShowFilters] = useState(false)
  const [agrupados, setAgrupados] = useState([])
  const [expandedPropietarios, setExpandedPropietarios] = useState({})

  // Agrupar guías por propietario
  useEffect(() => {
    // Filtrar guías primero
    let filteredGuias = [...guias]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredGuias = filteredGuias.filter(
        (guia) =>
          (guia.dueno_anterior_nombre && guia.dueno_anterior_nombre.toLowerCase().includes(term)) ||
          (guia.dueno_anterior_nit && guia.dueno_anterior_nit.toLowerCase().includes(term)),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      filteredGuias = filteredGuias.filter((guia) => {
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

    // Agrupar por propietario
    const grupos = {}

    filteredGuias.forEach((guia) => {
      const propietarioId = guia.id_dueno_anterior || "sin_propietario"
      const propietarioNombre = guia.dueno_anterior_nombre || "Sin propietario"
      const propietarioNit = guia.dueno_anterior_nit || "N/A"

      if (!grupos[propietarioId]) {
        grupos[propietarioId] = {
          id: propietarioId,
          nombre: propietarioNombre,
          nit: propietarioNit,
          cantidad: 0,
          guias: [],
        }
      }

      grupos[propietarioId].cantidad += 1
      grupos[propietarioId].guias.push(guia)
    })

    // Convertir a array y ordenar por nombre
    const result = Object.values(grupos).sort((a, b) => {
      return a.nombre.localeCompare(b.nombre)
    })

    setAgrupados(result)
  }, [guias, searchTerm, dateRange])

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  // Alternar expansión de propietario
  const togglePropietario = (propietarioId) => {
    setExpandedPropietarios({
      ...expandedPropietarios,
      [propietarioId]: !expandedPropietarios[propietarioId],
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por propietario, NIT..."
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
              <TableHead></TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Cantidad de Guías</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agrupados.length > 0 ? (
              agrupados.map((propietario) => (
                <>
                  <TableRow
                    key={propietario.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => togglePropietario(propietario.id)}
                  >
                    <TableCell className="w-10">
                      {expandedPropietarios[propietario.id] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{propietario.nombre}</TableCell>
                    <TableCell>{propietario.nit}</TableCell>
                    <TableCell>{propietario.cantidad}</TableCell>
                  </TableRow>

                  {expandedPropietarios[propietario.id] &&
                    propietario.guias.map((guia) => (
                      <TableRow key={`${propietario.id}-${guia.id}`} className="bg-muted/20">
                        <TableCell></TableCell>
                        <TableCell className="pl-8">Guía: {guia.numero_documento}</TableCell>
                        <TableCell>Fecha: {formatDisplayDate(guia.fecha_documento)}</TableCell>
                        <TableCell>{guia.dueno_nuevo_nombre ? `Para: ${guia.dueno_nuevo_nombre}` : ""}</TableCell>
                      </TableRow>
                    ))}
                </>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron guías con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">Mostrando {agrupados.length} propietarios</div>
    </div>
  )
}
