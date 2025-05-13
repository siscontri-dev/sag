"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar, Filter, ArrowUpDown } from "lucide-react"
import ExportTicketsAgrupadosButtons from "./export-tickets-agrupados-buttons"
import { processObjectDates } from "@/lib/date-interceptor"

export default function TicketsAgrupadosPorDia({ tickets = [] }) {
  // Usar useMemo para procesar los tickets solo cuando cambien
  const processedTickets = useMemo(() => processObjectDates(tickets), [tickets])

  // Estado para filtros
  const today = new Date()
  const [fechaInicio, setFechaInicio] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)
  const [filteredTickets, setFilteredTickets] = useState(processedTickets)
  const [sortConfig, setSortConfig] = useState({ key: "fecha", direction: "desc" })
  const [agrupacion, setAgrupacion] = useState("dia") // dia, semana, mes

  // Función para parsear fechas en formato DD/MM/YYYY
  const parseDateDMY = (dateString) => {
    if (!dateString) return null

    try {
      // Si ya es un objeto Date, devolverlo
      if (dateString instanceof Date) {
        return dateString
      }

      // Si es un string en formato DD/MM/YYYY
      if (typeof dateString === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split("/").map(Number)
        return new Date(year, month - 1, day)
      }

      // Intentar parsear como fecha ISO
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date
      }

      return null
    } catch (error) {
      console.error(`Error al parsear fecha: ${dateString}`, error)
      return null
    }
  }

  // Función para obtener la clave de agrupación según el tipo seleccionado
  const getGroupKey = (date) => {
    if (!date) return "Sin fecha"

    const parsedDate = parseDateDMY(date)
    if (!parsedDate) return "Sin fecha"

    if (agrupacion === "dia") {
      return format(parsedDate, "dd/MM/yyyy")
    } else if (agrupacion === "semana") {
      const startWeek = startOfWeek(parsedDate, { locale: es })
      const endWeek = endOfWeek(parsedDate, { locale: es })
      return `${format(startWeek, "dd/MM/yyyy")} - ${format(endWeek, "dd/MM/yyyy")}`
    } else if (agrupacion === "mes") {
      return format(parsedDate, "MMMM yyyy", { locale: es })
    }

    return "Sin fecha"
  }

  // Filtrar tickets por fecha
  useEffect(() => {
    const fromDate = startOfDay(new Date(fechaInicio))
    const toDate = endOfDay(new Date(fechaFin))

    const filtered = processedTickets.filter((ticket) => {
      try {
        if (!ticket.fecha) return false

        const ticketDate = parseDateDMY(ticket.fecha)
        if (!ticketDate) return false

        return isWithinInterval(ticketDate, {
          start: fromDate,
          end: toDate,
        })
      } catch (error) {
        console.error(`Error al procesar fecha en ticket:`, error)
        return false
      }
    })

    setFilteredTickets(filtered)
  }, [tickets, fechaInicio, fechaFin]) // Cambiar processedTickets por tickets original

  // Agrupar tickets por día, semana o mes
  const groupedTickets = useMemo(() => {
    const groups = {}

    filteredTickets.forEach((ticket) => {
      const key = getGroupKey(ticket.fecha)

      if (!groups[key]) {
        groups[key] = {
          fecha: key,
          tickets: [],
          totalTickets: 0,
          totalKilos: 0,
          totalValor: 0,
          machos: 0,
          hembras: 0,
        }
      }

      groups[key].tickets.push(ticket)
      groups[key].totalTickets += 1
      groups[key].totalKilos += Number.parseFloat(ticket.kilos || 0)
      groups[key].totalValor += Number.parseFloat(ticket.valor || 0)

      // Contar machos y hembras si hay información de género
      if (ticket.genero === "M") {
        groups[key].machos += 1
      } else if (ticket.genero === "H") {
        groups[key].hembras += 1
      }
    })

    // Convertir a array y ordenar
    const result = Object.values(groups)

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === "fecha") {
          // Para fechas, intentar ordenar cronológicamente
          const dateA = a.fecha === "Sin fecha" ? new Date(0) : parseDateDMY(a.fecha)
          const dateB = b.fecha === "Sin fecha" ? new Date(0) : parseDateDMY(b.fecha)

          if (!dateA) return 1
          if (!dateB) return -1

          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA
        }

        // Para valores numéricos
        const valueA = a[sortConfig.key] || 0
        const valueB = b[sortConfig.key] || 0
        return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA
      })
    }

    return result
  }, [filteredTickets, agrupacion, sortConfig])

  // Calcular totales generales
  const totales = useMemo(() => {
    return {
      totalTickets: groupedTickets.reduce((sum, group) => sum + group.totalTickets, 0),
      totalKilos: groupedTickets.reduce((sum, group) => sum + group.totalKilos, 0),
      totalValor: groupedTickets.reduce((sum, group) => sum + group.totalValor, 0),
      totalMachos: groupedTickets.reduce((sum, group) => sum + group.machos, 0),
      totalHembras: groupedTickets.reduce((sum, group) => sum + group.hembras, 0),
    }
  }, [groupedTickets])

  // Función para cambiar el ordenamiento
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Funciones para filtros de fecha rápidos
  const setToday = () => {
    setFechaInicio(today)
    setFechaFin(today)
  }

  const setThisWeek = () => {
    const start = startOfWeek(today, { locale: es })
    const end = endOfWeek(today, { locale: es })
    setFechaInicio(start)
    setFechaFin(end)
  }

  const setThisMonth = () => {
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    setFechaInicio(start)
    setFechaFin(end)
  }

  // Determinar el tipo predominante para los colores
  const bovinosCount = filteredTickets.filter((t) => t.business_location_id === 1).length
  const porcinosCount = filteredTickets.filter((t) => t.business_location_id === 2).length
  const tipoPredominante = bovinosCount >= porcinosCount ? "bovino" : "porcino"
  const colors = themeColors[tipoPredominante]

  // Formatear fechas para exportación
  const formattedFechaDesde = format(fechaInicio, "yyyy-MM-dd")
  const formattedFechaHasta = format(fechaFin, "yyyy-MM-dd")

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
              {formatNumber(totales.totalTickets)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Kilos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(totales.totalKilos)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Valor Total</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatCurrency(totales.totalValor)}
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
            <ExportTicketsAgrupadosButtons
              tipo={tipoPredominante === "bovino" ? "bovino" : "porcino"}
              fechaDesde={formattedFechaDesde}
              fechaHasta={formattedFechaHasta}
              agrupacion={agrupacion}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="fecha-inicial" className="text-xs mb-1 block">
                Fecha Inicial
              </Label>
              <Popover placement="bottom-start">
                <PopoverTrigger asChild>
                  <Button
                    id="fecha-inicial"
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(fechaInicio, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <CalendarComponent
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                    initialFocus
                    locale={es}
                  />
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
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(fechaFin, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <CalendarComponent
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="agrupacion" className="text-xs mb-1 block">
                Agrupar por
              </Label>
              <Select value={agrupacion} onValueChange={setAgrupacion}>
                <SelectTrigger id="agrupacion">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Día</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setFechaInicio(today)
                  setFechaFin(today)
                  setAgrupacion("dia")
                  setSortConfig({ key: "fecha", direction: "desc" })
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tickets agrupados */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>
            Tickets Agrupados por {agrupacion === "dia" ? "Día" : agrupacion === "semana" ? "Semana" : "Mes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      <TableHead className="cursor-pointer" onClick={() => requestSort("totalTickets")}>
                        <div className="flex items-center">
                          Tickets
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("machos")}>
                        <div className="flex items-center">
                          Machos
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => requestSort("hembras")}>
                        <div className="flex items-center">
                          Hembras
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => requestSort("totalKilos")}>
                        <div className="flex items-center justify-end">
                          Kilos
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer" onClick={() => requestSort("totalValor")}>
                        <div className="flex items-center justify-end">
                          Valor
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No se encontraron tickets con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedTickets.map((group, index) => (
                        <TableRow
                          key={group.fecha}
                          className={index % 2 === 0 ? "bg-white" : `bg-opacity-20`}
                          style={index % 2 !== 0 ? { backgroundColor: colors.light } : {}}
                        >
                          <TableCell className="font-medium">{group.fecha}</TableCell>
                          <TableCell>{formatNumber(group.totalTickets)}</TableCell>
                          <TableCell>{formatNumber(group.machos)}</TableCell>
                          <TableCell>{formatNumber(group.hembras)}</TableCell>
                          <TableCell className="text-right">{formatNumber(group.totalKilos)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(group.totalValor)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {groupedTickets.length > 0 && (
                      <TableRow className="font-bold bg-gray-100">
                        <TableCell className="text-right">TOTALES:</TableCell>
                        <TableCell>{formatNumber(totales.totalTickets)}</TableCell>
                        <TableCell>{formatNumber(totales.totalMachos)}</TableCell>
                        <TableCell>{formatNumber(totales.totalHembras)}</TableCell>
                        <TableCell className="text-right">{formatNumber(totales.totalKilos)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totales.totalValor)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
