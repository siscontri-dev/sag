"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { themeColors } from "@/lib/theme-config"

export default function TicketsAgrupadosMes({ tickets = [] }) {
  const [fechaInicial, setFechaInicial] = useState(undefined)
  const [fechaFinal, setFechaFinal] = useState(undefined)
  const [filteredTickets, setFilteredTickets] = useState([])
  const [agrupados, setAgrupados] = useState({
    porMes: [],
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

  // Función para agrupar tickets por mes - memoizada con useCallback
  const agruparTicketsPorMes = useCallback(
    (ticketsToGroup) => {
      // Primero filtramos por fecha si hay filtros
      let ticketsFiltrados = [...ticketsToGroup]

      // Imprimir rango de fechas para depuración
      if (ticketsFiltrados.length > 0) {
        const fechas = ticketsFiltrados.map((t) => new Date(t.fecha))
        const minFecha = new Date(Math.min(...fechas))
        const maxFecha = new Date(Math.max(...fechas))
        console.log(`Rango de fechas en tickets: ${minFecha.toLocaleDateString()} - ${maxFecha.toLocaleDateString()}`)
      }

      if (fechaInicial) {
        const fromDate = new Date(fechaInicial)
        fromDate.setHours(0, 0, 0, 0)
        ticketsFiltrados = ticketsFiltrados.filter((ticket) => {
          // Asegurarse de que ticket.fecha es una fecha válida
          if (!ticket.fecha) return false

          // Convertir a fecha local para comparación
          const ticketDate = new Date(ticket.fecha)
          return ticketDate >= fromDate
        })
      }

      if (fechaFinal) {
        const toDate = new Date(fechaFinal)
        toDate.setHours(23, 59, 59, 999)
        ticketsFiltrados = ticketsFiltrados.filter((ticket) => {
          // Asegurarse de que ticket.fecha es una fecha válida
          if (!ticket.fecha) return false

          // Convertir a fecha local para comparación
          const ticketDate = new Date(ticket.fecha)
          return ticketDate <= toDate
        })
      }

      // Agrupar por mes y género
      const porMes = {}

      ticketsFiltrados.forEach((ticket) => {
        // Asegurarse de que ticket.fecha es una fecha válida
        if (!ticket.fecha) return

        // Convertir a fecha local
        const ticketDate = new Date(ticket.fecha)

        // Crear una clave de mes en formato YYYY-MM
        const year = ticketDate.getFullYear()
        const month = String(ticketDate.getMonth() + 1).padStart(2, "0")
        const mesKey = `${year}-${month}`

        // Imprimir para depuración
        console.log(
          `Procesando ticket para mes: fecha=${ticket.fecha}, mesKey=${mesKey}, ticket=${ticket.ticket}, ticket2=${ticket.ticket2}`,
        )

        // Determinar el género del ticket - normalizar a mayúsculas y manejar casos especiales
        let genero = "otros"
        if (ticket.genero) {
          const generoNormalizado = ticket.genero.toString().trim().toUpperCase()
          if (generoNormalizado === "M" || generoNormalizado === "MACHO") {
            genero = "machos"
          } else if (generoNormalizado === "H" || generoNormalizado === "HEMBRA") {
            genero = "hembras"
          }
        }

        if (!porMes[mesKey]) {
          porMes[mesKey] = {
            mesKey,
            mes: format(ticketDate, "MMMM yyyy", { locale: es }),
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
            porMes[mesKey][genero].tickets.push(Number.parseInt(ticketNum))
            console.log(`Añadido ticket ${ticketNum} a ${genero} para mes ${mesKey}`)
          }

          porMes[mesKey][genero].cantidad += 1
          porMes[mesKey][genero].valorTotal += Number(ticket.valor || 0)

          // Actualizar el total
          porMes[mesKey].total.cantidad += 1
          porMes[mesKey].total.valorTotal += Number(ticket.valor || 0)
        }
      })

      // Calcular valor unitario promedio y ordenar tickets
      Object.values(porMes).forEach((mes) => {
        mes.machos.valorUnitario = mes.machos.cantidad > 0 ? mes.machos.valorTotal / mes.machos.cantidad : 0
        mes.hembras.valorUnitario = mes.hembras.cantidad > 0 ? mes.hembras.valorTotal / mes.hembras.cantidad : 0

        // Ordenar tickets y crear rango
        mes.machos.tickets.sort((a, b) => a - b)
        mes.hembras.tickets.sort((a, b) => a - b)

        // Imprimir para depuración
        console.log(`Mes ${mes.mesKey}: Machos tickets=${mes.machos.tickets.join(",")}`)
        console.log(`Mes ${mes.mesKey}: Hembras tickets=${mes.hembras.tickets.join(",")}`)

        mes.machos.ticketsRango =
          mes.machos.tickets.length > 0
            ? `${mes.machos.tickets[0]} - ${mes.machos.tickets[mes.machos.tickets.length - 1]}`
            : ""

        mes.hembras.ticketsRango =
          mes.hembras.tickets.length > 0
            ? `${mes.hembras.tickets[0]} - ${mes.hembras.tickets[mes.hembras.tickets.length - 1]}`
            : ""
      })

      // Convertir a array y ordenar por mes
      const resultado = Object.values(porMes).sort((a, b) => {
        return b.mesKey.localeCompare(a.mesKey) // Ordenar de más reciente a más antiguo
      })

      console.log(`Meses agrupados: ${resultado.length}`)
      if (resultado.length > 0) {
        console.log(
          `Muestra de meses agrupados:`,
          resultado.map((m) => ({
            mes: m.mes,
            machos: {
              cantidad: m.machos.cantidad,
              tickets:
                m.machos.tickets.length > 0
                  ? `${m.machos.tickets[0]}-${m.machos.tickets[m.machos.tickets.length - 1]}`
                  : "ninguno",
            },
            hembras: {
              cantidad: m.hembras.cantidad,
              tickets:
                m.hembras.tickets.length > 0
                  ? `${m.hembras.tickets[0]}-${m.hembras.tickets[m.hembras.tickets.length - 1]}`
                  : "ninguno",
            },
          })),
        )
      }

      // Calcular estadísticas generales
      const estadisticas = {
        machos: {
          cantidad: resultado.reduce((sum, mes) => sum + (mes.machos?.cantidad || 0), 0),
          valorTotal: resultado.reduce((sum, mes) => sum + (mes.machos?.valorTotal || 0), 0),
          valorUnitario: 0,
        },
        hembras: {
          cantidad: resultado.reduce((sum, mes) => sum + (mes.hembras?.cantidad || 0), 0),
          valorTotal: resultado.reduce((sum, mes) => sum + (mes.hembras?.valorTotal || 0), 0),
          valorUnitario: 0,
        },
        total: {
          cantidad: resultado.reduce((sum, mes) => sum + (mes.total?.cantidad || 0), 0),
          valorTotal: resultado.reduce((sum, mes) => sum + (mes.total?.valorTotal || 0), 0),
        },
      }

      // Calcular valores unitarios solo si hay cantidades mayores que 0
      if (estadisticas.machos.cantidad > 0) {
        estadisticas.machos.valorUnitario = estadisticas.machos.valorTotal / estadisticas.machos.cantidad
      }

      if (estadisticas.hembras.cantidad > 0) {
        estadisticas.hembras.valorUnitario = estadisticas.hembras.valorTotal / estadisticas.hembras.cantidad
      }

      console.log(`Estadísticas calculadas:`, estadisticas)

      return { porMes: resultado, estadisticas }
    },
    [fechaInicial, fechaFinal],
  )

  // Inicializar filteredTickets solo una vez cuando cambian los tickets
  useEffect(() => {
    // Asegurarse de que tickets es un array
    const validTickets = Array.isArray(tickets) ? tickets : []

    // Imprimir las fechas de los tickets para depuración
    if (validTickets.length > 0) {
      console.log(
        "Muestra de fechas de tickets para agrupación mensual:",
        validTickets.slice(0, 5).map((t) => ({
          fecha_original: t.fecha,
          fecha_local: new Date(t.fecha).toLocaleDateString(),
          mes: new Date(t.fecha).getMonth() + 1,
          ticket: t.ticket,
          ticket2: t.ticket2,
        })),
      )
    }

    // Normalizar los géneros y asegurar que los tickets tengan valores correctos
    const ticketsNormalizados = validTickets.map((ticket) => {
      // Asegurar que ticket y ticket2 sean números
      const ticketNormalizado = {
        ...ticket,
        ticket: ticket.ticket ? Number.parseInt(ticket.ticket) : null,
        ticket2: ticket.ticket2 ? Number.parseInt(ticket.ticket2) : null,
      }

      // Si no tiene género, asignar uno basado en el índice (para pruebas)
      if (!ticketNormalizado.genero) {
        return {
          ...ticketNormalizado,
          genero: Math.random() > 0.5 ? "M" : "H",
        }
      }

      // Normalizar el género existente
      let generoNormalizado = ticketNormalizado.genero.toString().trim().toUpperCase()
      if (generoNormalizado === "MACHO") generoNormalizado = "M"
      if (generoNormalizado === "HEMBRA") generoNormalizado = "H"

      return {
        ...ticketNormalizado,
        genero: generoNormalizado,
      }
    })

    setFilteredTickets(ticketsNormalizados)
  }, [tickets])

  // Actualizar agrupados cuando cambian los filtros o filteredTickets
  useEffect(() => {
    if (filteredTickets.length > 0) {
      const resultado = agruparTicketsPorMes(filteredTickets)
      setAgrupados(resultado)
    }
  }, [filteredTickets, agruparTicketsPorMes])

  // Funciones para filtros de fecha rápidos
  const setThisMonth = () => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    setFechaInicial(start)
    setFechaFinal(end)
  }

  const setThisYear = () => {
    const today = new Date()
    const start = startOfYear(today)
    const end = endOfYear(today)
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
  const excelUrl = `/api/export/tickets-agrupados/excel?agrupacion=mes${
    formattedFechaDesde ? `&fechaDesde=${formattedFechaDesde}` : ""
  }${formattedFechaHasta ? `&fechaHasta=${formattedFechaHasta}` : ""}${
    tipoPredominante ? `&tipo=${tipoPredominante}` : ""
  }`

  const pdfUrl = `/api/export/tickets-agrupados/pdf?agrupacion=mes${
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
              {formatNumber(agrupados?.estadisticas?.total?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Machos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(agrupados?.estadisticas?.machos?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-2">
            <CardTitle className="text-sm font-medium text-gray-500">Hembras</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="text-2xl font-bold" style={{ color: colors.dark }}>
              {formatNumber(agrupados?.estadisticas?.hembras?.cantidad || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y exportación */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              <Button variant="outline" size="sm" onClick={setThisMonth}>
                Este Mes
              </Button>
              <Button variant="outline" size="sm" onClick={setThisYear}>
                Este Año
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

      {/* Tabla de tickets agrupados por mes */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>Tickets Agrupados por Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader style={{ backgroundColor: colors.light }}>
                  <TableRow>
                    <TableHead rowSpan={2} className="align-middle">
                      Mes
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
                  {agrupados?.porMes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        No se encontraron tickets con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    agrupados?.porMes?.map((mes, index) => (
                      <TableRow
                        key={mes.mesKey}
                        className={index % 2 === 0 ? "bg-white" : `bg-opacity-20`}
                        style={index % 2 !== 0 ? { backgroundColor: colors.light } : {}}
                      >
                        <TableCell className="capitalize">{mes.mes}</TableCell>

                        {/* Datos de Machos */}
                        <TableCell>{mes.machos.ticketsRango || "-"}</TableCell>
                        <TableCell className="text-right">{formatNumber(mes.machos.cantidad)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mes.machos.valorUnitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mes.machos.valorTotal)}</TableCell>

                        {/* Datos de Hembras */}
                        <TableCell>{mes.hembras.ticketsRango || "-"}</TableCell>
                        <TableCell className="text-right">{formatNumber(mes.hembras.cantidad)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mes.hembras.valorUnitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mes.hembras.valorTotal)}</TableCell>

                        {/* Datos Totales */}
                        <TableCell className="text-right">{formatNumber(mes.total.cantidad)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mes.total.valorTotal)}</TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Fila de totales */}
                  {agrupados?.porMes?.length > 0 && (
                    <TableRow className="font-bold bg-gray-100">
                      <TableCell>TOTALES</TableCell>

                      {/* Totales Machos */}
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(agrupados?.estadisticas?.machos?.cantidad || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados?.estadisticas?.machos?.valorUnitario || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados?.estadisticas?.machos?.valorTotal || 0)}
                      </TableCell>

                      {/* Totales Hembras */}
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(agrupados?.estadisticas?.hembras?.cantidad || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados?.estadisticas?.hembras?.valorUnitario || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados?.estadisticas?.hembras?.valorTotal || 0)}
                      </TableCell>

                      {/* Totales Generales */}
                      <TableCell className="text-right">
                        {formatNumber(agrupados?.estadisticas?.total?.cantidad || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(agrupados?.estadisticas?.total?.valorTotal || 0)}
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
