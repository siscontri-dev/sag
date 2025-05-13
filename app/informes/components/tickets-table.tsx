"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Filter, X } from "lucide-react"
import { formatDisplayDate, parseToDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"

export default function TicketsTable({ tickets = [] }) {
  const [filteredTickets, setFilteredTickets] = useState(tickets)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState({ from: null, to: null })
  const [showFilters, setShowFilters] = useState(false)

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let result = [...tickets]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (ticket) =>
          (ticket.propietario && ticket.propietario.toLowerCase().includes(term)) ||
          (ticket.nit && ticket.nit.toLowerCase().includes(term)) ||
          (ticket.ticket && ticket.ticket.toString().includes(term)) ||
          (ticket.numero_guia && ticket.numero_guia.toLowerCase().includes(term)),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      result = result.filter((ticket) => {
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

    setFilteredTickets(result)
  }, [tickets, searchTerm, dateRange])

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("")
    setDateRange({ from: null, to: null })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ticket, propietario, NIT..."
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
              <TableHead>Ticket</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Guía</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Raza</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Kilos</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <TableRow key={`${ticket.id}-${ticket.ticket}`}>
                  <TableCell className="font-medium">{ticket.ticket}</TableCell>
                  <TableCell>{formatDisplayDate(ticket.fecha)}</TableCell>
                  <TableCell>{ticket.numero_guia}</TableCell>
                  <TableCell>{ticket.propietario}</TableCell>
                  <TableCell>{ticket.nit}</TableCell>
                  <TableCell>{ticket.tipo}</TableCell>
                  <TableCell>{ticket.raza}</TableCell>
                  <TableCell>{ticket.color}</TableCell>
                  <TableCell>{ticket.genero}</TableCell>
                  <TableCell>{ticket.kilos}</TableCell>
                  <TableCell>
                    {typeof ticket.valor === "number"
                      ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(ticket.valor)
                      : ticket.valor}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.estado === "activo" ? "default" : "destructive"}>{ticket.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No se encontraron tickets con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredTickets.length} de {tickets.length} tickets
      </div>
    </div>
  )
}
