"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, ArrowUpDown, Printer, Calendar } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { Label } from "@/components/ui/label"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Importar componentes
import TicketPrinter from "@/components/ticket-printer"
import ExportTicketsButtons from "./export-tickets-buttons"

export default function TicketsTable({ tickets = [], currentLimit = 30 }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ticketSearch, setTicketSearch] = useState("")
  const [guiaSearch, setGuiaSearch] = useState("")
  const [propietarioSearch, setPropietarioSearch] = useState("")
  const [fechaInicial, setFechaInicial] = useState(undefined)
  const [fechaFinal, setFechaFinal] = useState(undefined)
  const [estado, setEstado] = useState("")
  const [filteredTickets, setFilteredTickets] = useState(tickets)
  const [sortConfig, setSortConfig] = useState({ key: "fecha", direction: "desc" })
  const [limit, setLimit] = useState(currentLimit)
  const [showDateFilters, setShowDateFilters] = useState(false)

  // Función para normalizar texto (quitar acentos, convertir a minúsculas)
  const normalizeText = (text) => {
    if (!text) return ""
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  }

  // Función mejorada para búsqueda de texto
  const textMatch = (text, search) => {
    if (!text || !search) return !search

    const normalizedText = normalizeText(text)
    const normalizedSearch = normalizeText(search)

    // Búsqueda exacta
    if (normalizedText === normalizedSearch) return true

    // Búsqueda por inclusión
    if (normalizedText.includes(normalizedSearch)) return true

    // Búsqueda por palabras
    const searchWords = normalizedSearch.split(/\s+/).filter(Boolean)
    return searchWords.every((word) => normalizedText.includes(word))
  }

  // Aplicar filtros
  useEffect(() => {
    let result = [...tickets]

    // Filtrar por número de ticket
    if (ticketSearch) {
      result = result.filter((ticket) => ticket.ticket2 && ticket.ticket2.toString().includes(ticketSearch))
    }

    // Filtrar por número de guía
    if (guiaSearch) {
      result = result.filter((ticket) => ticket.numero_guia && ticket.numero_guia.toString().includes(guiaSearch))
    }

    // Filtrar por propietario
    if (propietarioSearch) {
      result = result.filter(
        (ticket) =>
          (ticket.propietario && textMatch(ticket.propietario, propietarioSearch)) ||
          (ticket.nit && textMatch(ticket.nit, propietarioSearch)),
      )
    }

    // Filtrar por término de búsqueda general
    if (searchTerm) {
      result = result.filter(
        (ticket) =>
          (ticket.ticket && textMatch(ticket.ticket, searchTerm)) ||
          (ticket.ticket2 && textMatch(ticket.ticket2.toString(), searchTerm)) ||
          (ticket.numero_guia && textMatch(ticket.numero_guia.toString(), searchTerm)) ||
          (ticket.propietario && textMatch(ticket.propietario, searchTerm)) ||
          (ticket.nit && textMatch(ticket.nit, searchTerm)) ||
          (ticket.tipo && textMatch(ticket.tipo, searchTerm)) ||
          (ticket.raza && textMatch(ticket.raza, searchTerm)) ||
          (ticket.color && textMatch(ticket.color, searchTerm)) ||
          (ticket.genero && textMatch(ticket.genero, searchTerm)),
      )
    }

    // Filtrar por fecha inicial
    if (fechaInicial) {
      const fromDate = new Date(fechaInicial)
      fromDate.setHours(0, 0, 0, 0)
      result = result.filter((ticket) => {
        const ticketDate = new Date(ticket.fecha)
        return ticketDate >= fromDate
      })
    }

    // Filtrar por fecha final
    if (fechaFinal) {
      const toDate = new Date(fechaFinal)
      toDate.setHours(23, 59, 59, 999)
      result = result.filter((ticket) => {
        const ticketDate = new Date(ticket.fecha)
        return ticketDate <= toDate
      })
    }

    // Filtrar por estado
    if (estado) {
      result = result.filter((ticket) => ticket.estado === estado)
    }

    // Ordenar resultados
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Manejar valores nulos o indefinidos
        if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1
        if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1

        // Ordenar por fecha
        if (sortConfig.key === "fecha") {
          const dateA = new Date(a[sortConfig.key])
          const dateB = new Date(b[sortConfig.key])
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
        }

        // Ordenar por número de ticket (como número si es posible)
        if (sortConfig.key === "ticket") {
          const numA = Number.parseInt(a[sortConfig.key], 10) || 0
          const numB = Number.parseInt(b[sortConfig.key], 10) || 0
          return sortConfig.direction === "asc" ? numA - numB : numB - numA
        }

        // Ordenar por valor numérico
        if (sortConfig.key === "kilos" || sortConfig.key === "valor") {
          const numA = Number.parseFloat(a[sortConfig.key]) || 0
          const numB = Number.parseFloat(b[sortConfig.key]) || 0
          return sortConfig.direction === "asc" ? numA - numB : numB - numA
        }

        // Ordenar alfabéticamente para otros campos
        const valueA = a[sortConfig.key].toString().toLowerCase()
        const valueB = b[sortConfig.key].toString().toLowerCase()
        return sortConfig.direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      })
    }

    setFilteredTickets(result)
  }, [tickets, searchTerm, ticketSearch, guiaSearch, propietarioSearch, fechaInicial, fechaFinal, estado, sortConfig])

  // Función para cambiar el ordenamiento
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchTerm("")
    setTicketSearch("")
    setGuiaSearch("")
    setPropietarioSearch("")
    setFechaInicial(undefined)
    setFechaFinal(undefined)
    setEstado("")
  }

  // Funciones para filtros de fecha rápidos
  const setToday = () => {
    const today = new Date()
    setFechaInicial(today)
    setFechaFinal(today)
    setShowDateFilters(true)
  }

  const setThisWeek = () => {
    const today = new Date()
    const start = startOfWeek(today, { locale: es })
    const end = endOfWeek(today, { locale: es })
    setFechaInicial(start)
    setFechaFinal(end)
    setShowDateFilters(true)
  }

  const setThisMonth = () => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    setFechaInicial(start)
    setFechaFinal(end)
    setShowDateFilters(true)
  }

  // Calcular totales
  const totalTickets = filteredTickets.length
  const totalKilos = filteredTickets.reduce((sum, ticket) => sum + Number.parseFloat(ticket.kilos || 0), 0)
  const totalValor = filteredTickets.reduce((sum, ticket) => sum + Number.parseFloat(ticket.valor || 0), 0)

  // Determinar el tipo predominante para los colores
  const bovinosCount = filteredTickets.filter((t) => t.business_location_id === 1).length
  const porcinosCount = filteredTickets.filter((t) => t.business_location_id === 2).length
  const tipoPredominante = bovinosCount >= porcinosCount ? "bovino" : "porcino"
  const colors = themeColors[tipoPredominante]

  // Formatear fechas para exportación
  const formattedFechaDesde = fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : undefined
  const formattedFechaHasta = fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : undefined

  // Reorganizar las columnas en la tabla de tickets
  return (
    <div className="space-y-4">
      {/* Indicadores de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(totalTickets)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Kilos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(totalKilos)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Valor Total</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatCurrency(totalValor)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              <Button variant="outline" size="sm" onClick={setToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={setThisWeek}>
                Esta Semana
              </Button>
              <Button variant="outline" size="sm" onClick={setThisMonth}>
                Este Mes
              </Button>
            </div>

            {/* Botones de exportación en la parte superior */}
            <ExportTicketsButtons
              tipo={tipoPredominante === "bovino" ? "bovino" : "porcino"}
              estado={estado}
              fechaDesde={formattedFechaDesde}
              fechaHasta={formattedFechaHasta}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="fecha-inicial" className="text-xs mb-1 block">
                Fecha Inicial
              </Label>
              <Popover placement="bottom-start">
                <PopoverTrigger asChild>
                  <Button
                    id="fecha-inicial"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaInicial && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaInicial ? format(fechaInicial, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <CalendarComponent mode="single" selected={fechaInicial} onSelect={setFechaInicial} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="fecha-final" className="text-xs mb-1 block">
                Fecha Final
              </Label>
              <Popover placement="bottom-start">
                <PopoverTrigger asChild>
                  <Button
                    id="fecha-final"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !fechaFinal && "text-muted-foreground")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {fechaFinal ? format(fechaFinal, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <CalendarComponent mode="single" selected={fechaFinal} onSelect={setFechaFinal} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Label htmlFor="ticket-search" className="text-xs mb-1 block">
                Nº Ticket
              </Label>
              <Input
                id="ticket-search"
                placeholder="Buscar por número de ticket"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-9 h-4 w-4 text-gray-400" />
              {ticketSearch && (
                <X
                  className="absolute right-2 top-9 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => setTicketSearch("")}
                />
              )}
            </div>
            <div className="relative">
              <Label htmlFor="guia-search" className="text-xs mb-1 block">
                Nº Guía
              </Label>
              <Input
                id="guia-search"
                placeholder="Buscar por número de guía"
                value={guiaSearch}
                onChange={(e) => setGuiaSearch(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-9 h-4 w-4 text-gray-400" />
              {guiaSearch && (
                <X
                  className="absolute right-2 top-9 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => setGuiaSearch("")}
                />
              )}
            </div>
            <div className="relative">
              <Label htmlFor="propietario-search" className="text-xs mb-1 block">
                Propietario/NIT
              </Label>
              <Input
                id="propietario-search"
                placeholder="Buscar por propietario o NIT"
                value={propietarioSearch}
                onChange={(e) => setPropietarioSearch(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-9 h-4 w-4 text-gray-400" />
              {propietarioSearch && (
                <X
                  className="absolute right-2 top-9 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => setPropietarioSearch("")}
                />
              )}
            </div>
            <div className="relative">
              <Label htmlFor="search-term" className="text-xs mb-1 block">
                Búsqueda general
              </Label>
              <Input
                id="search-term"
                placeholder="Buscar en todos los campos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-9 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <X
                  className="absolute right-2 top-9 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => setSearchTerm("")}
                />
              )}
            </div>
            <div className="relative">
              <Label htmlFor="estado-filter" className="text-xs mb-1 block">
                Estado
              </Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger id="estado-filter">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="anulado">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
                Limpiar Filtros
              </Button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Límite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 filas</SelectItem>
                  <SelectItem value="30">30 filas</SelectItem>
                  <SelectItem value="50">50 filas</SelectItem>
                  <SelectItem value="100">100 filas</SelectItem>
                  <SelectItem value="-1">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tickets con altura máxima y desplazamiento vertical */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Listado de Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Contenedor con altura máxima y desplazamiento vertical */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader style={{ backgroundColor: colors.light }}>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("fecha")}>
                        <div className="flex items-center">
                          Fecha
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("numero_guia")}>
                        <div className="flex items-center">
                          Nº Guía
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("ticket2")}>
                        <div className="flex items-center">
                          Nº Ticket
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => requestSort("ticket")}>
                        <div className="flex items-center">
                          Código
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="">Propietario</TableHead>
                      <TableHead className="">NIT</TableHead>
                      <TableHead className="">Tipo</TableHead>
                      <TableHead className="">Raza</TableHead>
                      <TableHead className="">Color</TableHead>
                      <TableHead className="">Género</TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => requestSort("kilos")}>
                        <div className="flex items-center justify-end">
                          Kilos
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => requestSort("valor")}>
                        <div className="flex items-center justify-end">
                          Valor
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                          No se encontraron tickets con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.slice(0, limit === -1 ? undefined : limit).map((ticket, index) => (
                        <TableRow
                          key={ticket.id}
                          className={index % 2 === 0 ? "bg-white" : `bg-opacity-20`}
                          style={index % 2 !== 0 ? { backgroundColor: colors.light } : {}}
                        >
                          <TableCell>{ticket.fecha ? formatDate(ticket.fecha) : ""}</TableCell>
                          <TableCell>{ticket.numero_guia || "-"}</TableCell>
                          <TableCell>{ticket.ticket2 || "-"}</TableCell>
                          <TableCell className="font-medium">{ticket.ticket}</TableCell>
                          <TableCell>{ticket.propietario || "-"}</TableCell>
                          <TableCell>{ticket.nit || "-"}</TableCell>
                          <TableCell>{ticket.tipo || "-"}</TableCell>
                          <TableCell>{ticket.raza || "-"}</TableCell>
                          <TableCell>{ticket.color || "-"}</TableCell>
                          <TableCell>
                            {ticket.genero === "M" ? "Macho" : ticket.genero === "H" ? "Hembra" : ticket.genero || "-"}
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(ticket.kilos)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(ticket.valor)}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Imprimir Ticket">
                              <TicketPrinter
                                ticketData={{
                                  ticketNumber: Number(ticket.ticket) || 0,
                                  ticket2: Number(ticket.ticket2) || 0,
                                  fecha: ticket.fecha ? new Date(ticket.fecha).toLocaleDateString("es-CO") : "",
                                  duenioAnterior: ticket.propietario || "",
                                  cedulaDuenio: ticket.nit || "",
                                  tipoAnimal: ticket.tipo || "",
                                  sku: ticket.ticket || "",
                                  pesoKg: Number(ticket.kilos) || 0,
                                  raza: ticket.raza || "",
                                  color: ticket.color || "",
                                  genero:
                                    ticket.genero === "M"
                                      ? "Macho"
                                      : ticket.genero === "H"
                                        ? "Hembra"
                                        : ticket.genero || "",
                                  valor: Number(ticket.valor) || 0,
                                }}
                              >
                                <Printer className="h-4 w-4" />
                              </TicketPrinter>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {filteredTickets.length > 0 && (
                      <TableRow className="font-bold bg-gray-100">
                        <TableCell colSpan={10} className="text-right">
                          TOTALES:
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(totalKilos)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalValor)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Mostrando {Math.min(filteredTickets.length, limit === -1 ? filteredTickets.length : limit)} de{" "}
            {filteredTickets.length} tickets
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}
