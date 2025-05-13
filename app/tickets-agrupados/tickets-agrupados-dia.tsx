"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { themeColors } from "@/lib/theme-config"

export default function TicketsAgrupadosDia({ tickets = [] }) {
  const [fechaInicial, setFechaInicial] = useState(undefined)
  const [fechaFinal, setFechaFinal] = useState(undefined)
  const [filteredTickets, setFilteredTickets] = useState([])
  const [agrupados, setAgrupados] = useState({
    porDia: [],
    estadisticas: {
      machos: {
        cantidad: 0,
        valorUnitario: 0,
        valorTotal: 0,
      },
      hembras: {
        cantidad: 0,
        valorUnitario: 0,
        valorTotal: 0,
      },
      total: {
        cantidad: 0,
        valorTotal: 0,
      },
    },
  })

  // Función mejorada para obtener la clave de fecha (YYYY-MM-DD)
  const getFechaKey = (fechaInput) => {
    try {
      // Si es null o undefined, usar la fecha actual
      if (fechaInput === null || fechaInput === undefined) {
        console.warn("Fecha nula o indefinida, usando fecha actual")
        const now = new Date()
        return format(now, "yyyy-MM-dd")
      }

      // Si ya es un objeto Date, formatear directamente
      if (fechaInput instanceof Date) {
        return format(fechaInput, "yyyy-MM-dd")
      }

      // Si es string, intentar convertir a Date
      if (typeof fechaInput === "string") {
        // Intentar crear una fecha a partir del string
        const fecha = new Date(fechaInput)

        // Verificar si la fecha es válida
        if (!isNaN(fecha.getTime())) {
          return format(fecha, "yyyy-MM-dd")
        }

        // Si no es válida, intentar parsear formatos comunes
        if (fechaInput.includes("/")) {
          // Formato DD/MM/YYYY
          const [day, month, year] = fechaInput.split("/")
          const parsedDate = new Date(`${year}-${month}-${day}`)
          if (!isNaN(parsedDate.getTime())) {
            return format(parsedDate, "yyyy-MM-dd")
          }
        }

        // Intentar con formato ISO
        if (fechaInput.includes("T")) {
          const isoDate = new Date(fechaInput)
          if (!isNaN(isoDate.getTime())) {
            return format(isoDate, "yyyy-MM-dd")
          }
        }
      }

      // Si llegamos aquí, no pudimos parsear la fecha
      console.error("No se pudo parsear la fecha:", fechaInput)
      return format(new Date(), "yyyy-MM-dd") // Fallback a fecha actual
    } catch (error) {
      console.error("Error al procesar fecha:", error, fechaInput)
      return format(new Date(), "yyyy-MM-dd") // Fallback a fecha actual
    }
  }

  // Función mejorada para formatear fecha para UI (DD/MM/YYYY)
  const formatFechaParaUI = (fechaInput) => {
    try {
      // Si es null o undefined, devolver string vacío
      if (fechaInput === null || fechaInput === undefined) {
        return ""
      }

      // Si ya es un objeto Date, formatear directamente
      if (fechaInput instanceof Date) {
        return format(fechaInput, "dd/MM/yyyy")
      }

      // Si es string, intentar convertir a Date
      if (typeof fechaInput === "string") {
        // Intentar crear una fecha a partir del string
        const fecha = new Date(fechaInput)

        // Verificar si la fecha es válida
        if (!isNaN(fecha.getTime())) {
          return format(fecha, "dd/MM/yyyy")
        }

        // Si no es válida, intentar parsear formatos comunes
        if (fechaInput.includes("-")) {
          // Formato YYYY-MM-DD
          const [year, month, day] = fechaInput.split("-")
          return `${day}/${month}/${year}`
        }

        if (fechaInput.includes("/")) {
          // Ya está en formato DD/MM/YYYY
          return fechaInput
        }
      }

      // Si llegamos aquí, no pudimos parsear la fecha
      console.error("No se pudo formatear la fecha para UI:", fechaInput)
      return String(fechaInput) // Devolver el input original como string
    } catch (error) {
      console.error("Error al formatear fecha para UI:", error, fechaInput)
      return String(fechaInput) // Devolver el input original como string
    }
  }

  // Función para agrupar tickets por día - memoizada con useCallback
  const agruparTicketsPorDia = useCallback(
    (ticketsToGroup) => {
      console.log(`Agrupando ${ticketsToGroup.length} tickets por día`)

      // Verificar distribución de géneros
      const machosCount = ticketsToGroup.filter((t) => t.genero === "M").length
      const hembrasCount = ticketsToGroup.filter((t) => t.genero === "H").length
      console.log(`Distribución por género: Machos=${machosCount}, Hembras=${hembrasCount}`)

      // Primero filtramos por fecha si hay filtros
      let ticketsFiltrados = [...ticketsToGroup]

      // Imprimir muestra de fechas para depuración
      if (ticketsFiltrados.length > 0) {
        const muestraTickets = ticketsFiltrados.slice(0, 5)
        console.log(
          "Muestra de tickets con fechas:",
          muestraTickets.map((t) => ({
            fecha_original: t.fecha,
            fecha_key: getFechaKey(t.fecha),
            fecha_ui: formatFechaParaUI(t.fecha),
          })),
        )
      }

      if (fechaInicial) {
        const fromDate = new Date(fechaInicial)
        fromDate.setHours(0, 0, 0, 0)
        ticketsFiltrados = ticketsFiltrados.filter((ticket) => {
          try {
            if (!ticket.fecha) return false
            const ticketDate = new Date(ticket.fecha)

            // Verificar si la fecha es válida
            if (isNaN(ticketDate.getTime())) {
              console.warn(`Fecha inválida en ticket: ${ticket.fecha}`)
              return false
            }

            return ticketDate >= fromDate
          } catch (error) {
            console.error("Error al filtrar por fecha inicial:", error)
            return false
          }
        })
      }

      if (fechaFinal) {
        const toDate = new Date(fechaFinal)
        toDate.setHours(23, 59, 59, 999)
        ticketsFiltrados = ticketsFiltrados.filter((ticket) => {
          try {
            if (!ticket.fecha) return false
            const ticketDate = new Date(ticket.fecha)

            // Verificar si la fecha es válida
            if (isNaN(ticketDate.getTime())) {
              return false
            }

            return ticketDate <= toDate
          } catch (error) {
            console.error("Error al filtrar por fecha final:", error)
            return false
          }
        })
      }

      console.log(`Después de filtrar por fecha: ${ticketsFiltrados.length} tickets`)

      // Agrupar por día y género
      const porDia = {}

      ticketsFiltrados.forEach((ticket) => {
        if (!ticket.fecha) return

        // Obtener la clave de fecha normalizada (YYYY-MM-DD)
        const fechaKey = getFechaKey(ticket.fecha)

        // Determinar el género del ticket
        let genero = "otros"
        if (ticket.genero) {
          const generoNormalizado = ticket.genero.toString().trim().toUpperCase()
          if (generoNormalizado === "M" || generoNormalizado === "MACHO") {
            genero = "machos"
          } else if (generoNormalizado === "H" || generoNormalizado === "HEMBRA") {
            genero = "hembras"
          }
        }

        // Inicializar el objeto para esta fecha si no existe
        if (!porDia[fechaKey]) {
          porDia[fechaKey] = {
            fecha: fechaKey,
            fechaOriginal: ticket.fecha,
            fechaFormateada: formatFechaParaUI(ticket.fecha),
            machos: {
              tickets: [],
              cantidad: 0,
              valorUnitario: 0,
              valorTotal: 0,
            },
            hembras: {
              tickets: [],
              cantidad: 0,
              valorUnitario: 0,
              valorTotal: 0,
            },
            total: {
              cantidad: 0,
              valorTotal: 0,
            },
          }
        }

        if (genero === "machos" || genero === "hembras") {
          // Usar ticket2 si está disponible, de lo contrario usar ticket
          const ticketNum = ticket.ticket2 || ticket.ticket || 0
          if (ticketNum) {
            porDia[fechaKey][genero].tickets.push(Number.parseInt(ticketNum))
          }

          porDia[fechaKey][genero].cantidad += 1
          porDia[fechaKey][genero].valorTotal += Number(ticket.valor || 0)

          // Actualizar el total
          porDia[fechaKey].total.cantidad += 1
          porDia[fechaKey].total.valorTotal += Number(ticket.valor || 0)
        }
      })

      // Calcular valor unitario promedio y ordenar tickets
      Object.values(porDia).forEach((dia) => {
        dia.machos.valorUnitario = dia.machos.cantidad > 0 ? dia.machos.valorTotal / dia.machos.cantidad : 0
        dia.hembras.valorUnitario = dia.hembras.cantidad > 0 ? dia.hembras.valorTotal / dia.hembras.cantidad : 0

        // Ordenar tickets y crear rango
        dia.machos.tickets.sort((a, b) => a - b)
        dia.hembras.tickets.sort((a, b) => a - b)

        dia.machos.ticketsRango =
          dia.machos.tickets.length > 0
            ? `${dia.machos.tickets[0]} - ${dia.machos.tickets[dia.machos.tickets.length - 1]}`
            : ""

        dia.hembras.ticketsRango =
          dia.hembras.tickets.length > 0
            ? `${dia.hembras.tickets[0]} - ${dia.hembras.tickets[dia.hembras.tickets.length - 1]}`
            : ""
      })

      // Convertir a array y ordenar por fecha (más reciente primero)
      const resultado = Object.values(porDia).sort((a, b) => {
        // Convertir las fechas a objetos Date para comparación
        const fechaA = new Date(a.fecha)
        const fechaB = new Date(b.fecha)
        return fechaB - fechaA // Orden descendente
      })

      console.log(`Días agrupados: ${resultado.length}`)

      // Imprimir muestra de días agrupados para depuración
      if (resultado.length > 0) {
        console.log(
          "Muestra de días agrupados:",
          resultado.slice(0, 3).map((d) => ({
            fecha: d.fecha,
            fechaFormateada: d.fechaFormateada,
            machos: d.machos.cantidad,
            hembras: d.hembras.cantidad,
          })),
        )
      }

      // Calcular estadísticas generales
      const estadisticas = {
        machos: {
          cantidad: resultado.reduce((sum, dia) => sum + dia.machos.cantidad, 0),
          valorTotal: resultado.reduce((sum, dia) => sum + dia.machos.valorTotal, 0),
          valorUnitario: 0,
        },
        hembras: {
          cantidad: resultado.reduce((sum, dia) => sum + dia.hembras.cantidad, 0),
          valorTotal: resultado.reduce((sum, dia) => sum + dia.hembras.valorTotal, 0),
          valorUnitario: 0,
        },
        total: {
          cantidad: resultado.reduce((sum, dia) => sum + dia.total.cantidad, 0),
          valorTotal: resultado.reduce((sum, dia) => sum + dia.total.valorTotal, 0),
        },
      }

      // Calcular valores unitarios solo si hay cantidades mayores que 0
      if (estadisticas.machos.cantidad > 0) {
        estadisticas.machos.valorUnitario = estadisticas.machos.valorTotal / estadisticas.machos.cantidad
      }

      if (estadisticas.hembras.cantidad > 0) {
        estadisticas.hembras.valorUnitario = estadisticas.hembras.valorTotal / estadisticas.hembras.cantidad
      }

      return { porDia: resultado, estadisticas }
    },
    [fechaInicial, fechaFinal],
  )

  // Inicializar filteredTickets cuando cambian los tickets
  useEffect(() => {
    // Asegurarse de que tickets es un array
    const validTickets = Array.isArray(tickets) ? tickets : []

    // Normalizar los tickets
    const ticketsNormalizados = validTickets.map((ticket) => {
      // Asegurar que la fecha sea válida
      let fechaValida = ticket.fecha

      // Si la fecha no es válida, usar la fecha actual
      if (!fechaValida) {
        fechaValida = new Date().toISOString()
      }

      // Asegurar que ticket y ticket2 sean números
      return {
        ...ticket,
        fecha: fechaValida,
        ticket: ticket.ticket ? Number.parseInt(ticket.ticket) : null,
        ticket2: ticket.ticket2 ? Number.parseInt(ticket.ticket2) : null,
        genero: ticket.genero ? ticket.genero.toString().trim().toUpperCase() : Math.random() > 0.5 ? "M" : "H",
      }
    })

    setFilteredTickets(ticketsNormalizados)
  }, [tickets])

  // Actualizar agrupados cuando cambian los filtros o filteredTickets
  useEffect(() => {
    if (filteredTickets.length > 0) {
      const resultado = agruparTicketsPorDia(filteredTickets)
      setAgrupados(resultado)
    }
  }, [filteredTickets, agruparTicketsPorDia])

  // Funciones para filtros de fecha rápidos
  const setToday = () => {
    const today = new Date()
    setFechaInicial(today)
    setFechaFinal(today)
  }

  const setThisWeek = () => {
    const today = new Date()
    const start = startOfWeek(today, { locale: es })
    const end = endOfWeek(today, { locale: es })
    setFechaInicial(start)
    setFechaFinal(end)
  }

  const setThisMonth = () => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    setFechaInicial(start)
    setFechaFinal(end)
  }

  const clearFilters = () => {
    setFechaInicial(undefined)
    setFechaFinal(undefined)
  }

  // Formatear fechas para exportación
  const formattedFechaDesde = fechaInicial ? format(fechaInicial, "yyyy-MM-dd") : undefined
  const formattedFechaHasta = fechaFinal ? format(fechaFinal, "yyyy-MM-dd") : undefined

  // Determinar el tipo predominante para los colores
  const bovinosCount = filteredTickets.filter((t) => t.business_location_id === 1).length
  const porcinosCount = filteredTickets.filter((t) => t.business_location_id === 2).length
  const tipoPredominante = bovinosCount >= porcinosCount ? "bovino" : "porcino"
  const colors = themeColors[tipoPredominante]

  // Construir URLs para exportación
  const excelUrl = `/api/export/tickets-agrupados/excel?agrupacion=dia${
    formattedFechaDesde ? `&fechaDesde=${formattedFechaDesde}` : ""
  }${formattedFechaHasta ? `&fechaHasta=${formattedFechaHasta}` : ""}${
    tipoPredominante ? `&tipo=${tipoPredominante}` : ""
  }`

  const pdfUrl = `/api/export/tickets-agrupados/pdf?agrupacion=dia${
    formattedFechaDesde ? `&fechaDesde=${formattedFechaDesde}` : ""
  }${formattedFechaHasta ? `&fechaHasta=${formattedFechaHasta}` : ""}${
    tipoPredominante ? `&tipo=${tipoPredominante}` : ""
  }`

  return (
    <div className="space-y-6">
      {/* Indicadores de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(agrupados.estadisticas.total?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Machos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(agrupados.estadisticas.machos?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Hembras</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(agrupados.estadisticas.hembras?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y exportación */}
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
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </div>

            {/* Botones de exportación */}
            <div className="flex gap-2">
              <a href={excelUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-600">
                  <FileDown className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </a>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600">
                  <FileDown className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </a>
            </div>
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
                    <span className="mr-2">📅</span>
                    {fechaInicial ? format(fechaInicial, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <Calendar mode="single" selected={fechaInicial} onSelect={setFechaInicial} initialFocus />
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
                    <span className="mr-2">📅</span>
                    {fechaFinal ? format(fechaFinal, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50">
                  <Calendar mode="single" selected={fechaFinal} onSelect={setFechaFinal} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de tickets agrupados por día */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Tickets Agrupados por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ backgroundColor: colors.light }}>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-middle">
                      Fecha
                    </TableHead>
                    <TableHead colSpan={4} className="text-center border-b">
                      Machos
                    </TableHead>
                    <TableHead colSpan={4} className="text-center border-b">
                      Hembras
                    </TableHead>
                    <TableHead colSpan={2} className="text-center border-b">
                      Total
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {/* Columnas para Machos */}
                    <TableHead>Tickets</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Valor Unitario</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>

                    {/* Columnas para Hembras */}
                    <TableHead>Tickets</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Valor Unitario</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>

                    {/* Columnas para Total */}
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agrupados.porDia.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        No se encontraron tickets con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    agrupados.porDia.map((dia, index) => (
                      <TableRow
                        key={dia.fecha}
                        className={index % 2 === 0 ? "bg-white" : `bg-opacity-20`}
                        style={index % 2 !== 0 ? { backgroundColor: colors.light } : {}}
                      >
                        <TableCell>{dia.fechaFormateada}</TableCell>

                        {/* Datos de Machos */}
                        <TableCell>{dia.machos.ticketsRango || "-"}</TableCell>
                        <TableCell className="text-right">{formatNumber(dia.machos?.cantidad || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dia.machos?.valorUnitario || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dia.machos?.valorTotal || 0)}</TableCell>

                        {/* Datos de Hembras */}
                        <TableCell>{dia.hembras.ticketsRango || "-"}</TableCell>
                        <TableCell className="text-right">{formatNumber(dia.hembras?.cantidad || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dia.hembras?.valorUnitario || 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dia.hembras?.valorTotal || 0)}</TableCell>

                        {/* Datos Totales */}
                        <TableCell className="text-right">{formatNumber(dia.total.cantidad)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dia.total.valorTotal)}</TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Fila de totales */}
                  {agrupados.porDia.length > 0 && (
                    <TableRow className="font-bold bg-gray-100">
                      <TableCell>TOTALES</TableCell>

                      {/* Totales Machos */}
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(agrupados.estadisticas.machos?.cantidad || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados.estadisticas.machos?.valorUnitario || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados.estadisticas.machos?.valorTotal || 0)}
                      </TableCell>

                      {/* Totales Hembras */}
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(agrupados.estadisticas.hembras?.cantidad || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados.estadisticas.hembras?.valorUnitario || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados.estadisticas.hembras?.valorTotal || 0)}
                      </TableCell>

                      {/* Totales Generales */}
                      <TableCell className="text-right">
                        {formatNumber(agrupados.estadisticas.total.cantidad)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados.estadisticas.total.valorTotal)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
