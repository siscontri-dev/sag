"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Filter, X } from "lucide-react"
import { formatDisplayDate, parseToDate } from "@/lib/date-utils"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"

export default function TicketsAgrupados({ tickets = [] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [showFilters, setShowFilters] = useState(false)
  const [agrupados, setAgrupados] = useState([])

  // Agrupar tickets por fecha
  useEffect(() => {
    // Filtrar tickets primero
    let filteredTickets = [...tickets]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredTickets = filteredTickets.filter(
        (ticket) =>
          (ticket.propietario && ticket.propietario.toLowerCase().includes(term)) ||
          (ticket.nit && ticket.nit.toLowerCase().includes(term)),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      filteredTickets = filteredTickets.filter((ticket) => {
        const ticketDate = parseToDate(ticket.fecha)

        if (!ticketDate) return true

        if (dateRange.from && dateRange.to) {
          return ticketDate >= dateRange.from && ticketDate <= dateRange.to
        } else if (dateRange.from) {
          return ticketDate >= dateRange.from
        } else if (dateRange.to) {
          return ticketDate <= dateRange.to
        }

        return true
      })
    }

    // Agrupar por fecha
    const grupos = {}

    filteredTickets.forEach((ticket) => {
      const fecha = formatDisplayDate(ticket.fecha)

      if (!grupos[fecha]) {
        grupos[fecha] = {
          fecha,
          cantidad: 0,
          kilos: 0,
          valor: 0,
          tickets: [],
        }
      }

      grupos[fecha].cantidad += 1
      grupos[fecha].kilos += Number(ticket.kilos) || 0
      grupos[fecha].valor += Number(ticket.valor) || 0
      grupos[fecha].tickets.push(ticket)
    })

    // Convertir a array y ordenar por fecha (más reciente primero)
    const result = Object.values(grupos).sort((a, b) => {
      const dateA = parseToDate(a.fecha)
      const dateB = parseToDate(b.fecha)
      return dateB - dateA
    })

    setAgrupados(result)
  }, [tickets, searchTerm, dateRange])

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  // Calcular totales
  const totales = {
    cantidad: agrupados.reduce((sum, grupo) => sum + grupo.cantidad, 0),
    kilos: agrupados.reduce((sum, grupo) => sum + grupo.kilos, 0),
    valor: agrupados.reduce((sum, grupo) => sum + grupo.valor, 0),
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
              <TableHead>Fecha</TableHead>
              <TableHead>Cantidad de Tickets</TableHead>
              <TableHead>Total Kilos</TableHead>
              <TableHead>Total Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agrupados.length > 0 ? (
              agrupados.map((grupo) => (
                <TableRow key={grupo.fecha}>
                  <TableCell className="font-medium">{grupo.fecha}</TableCell>
                  <TableCell>{grupo.cantidad}</TableCell>
                  <TableCell>{grupo.kilos.toLocaleString("es-CO")}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(grupo.valor)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron tickets con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
            {agrupados.length > 0 && (
              <TableRow className="bg-muted/50 font-medium">
                <TableCell>TOTALES</TableCell>
                <TableCell>{totales.cantidad}</TableCell>
                <TableCell>{totales.kilos.toLocaleString("es-CO")}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totales.valor)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
