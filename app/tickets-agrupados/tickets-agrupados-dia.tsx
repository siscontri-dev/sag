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

  // Reemplazar la función getFechaKey con esta versión corregida
  const getFechaKey = (fechaStr) => {
    // Si es un objeto Date, extraer los componentes directamente
    if (fechaStr instanceof Date) {
      const year = fechaStr.getFullYear()
      const month = String(fechaStr.getMonth() + 1).padStart(2, "0")
      const day = String(fechaStr.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    // Verificar si fechaStr es una cadena de texto
    if (typeof fechaStr !== "string") {
      console.error("getFechaKey recibió un valor no string:", fechaStr)

      // Si es otro tipo de dato, convertir a string si es posible
      try {
        fechaStr = String(fechaStr)
      } catch (error) {
        console.error("No se pudo convertir a string:", error)
        // Devolver la fecha actual como fallback
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const day = String(now.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }
    }

    // Intentar extraer año, mes y día directamente del string de fecha
    try {
      // Si tiene formato ISO (YYYY-MM-DDTHH:MM:SS.sssZ)
      if (fechaStr.includes("T")) {
        const partes = fechaStr.split("T")[0].split("-")
        if (partes.length === 3) {
          return `${partes[0]}-${partes[1]}-${partes[2]}`
        }
      }

      // Si tiene formato simple (YYYY-MM-DD)
      if (fechaStr.includes("-")) {
        const partes = fechaStr.split("-")
        if (partes.length === 3) {
          return `${partes[0]}-${partes[1]}-${partes[2]}`
        }
      }

      // Si tiene formato DD/MM/YYYY
      if (fechaStr.includes("/")) {
        const partes = fechaStr.split("/")
        if (partes.length === 3) {
          // Asumimos que el formato es DD/MM/YYYY y lo convertimos a YYYY-MM-DD
          return `${partes[2]}-${partes[1]}-${partes[0]}`
        }
      }

      // Si no se pudo extraer del string, crear un objeto Date y extraer los componentes
      const fecha = new Date(fechaStr)
      if (!isNaN(fecha.getTime())) {
        const year = fecha.getFullYear()
        const month = String(fecha.getMonth() + 1).padStart(2, "0")
        const day = String(fecha.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }

      throw new Error("Formato de fecha no reconocido")
    } catch (error) {
      console.error("Error al procesar fecha:", fechaStr, error)
      // Devolver la fecha actual como fallback
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
  }

  // Reemplazar la función formatFechaParaUI con esta versión mejorada
  const formatFechaParaUI = (fechaStr) => {
    try {
      // Verificar si fechaStr es una cadena de texto
      if (typeof fechaStr !== "string") {
        // Si es un objeto Date, formatear directamente
        if (fechaStr instanceof Date) {
          return fechaStr.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        }

        // Intentar convertir a string
        try {
          fechaStr = String(fechaStr)
        } catch (error) {
          console.error("No se pudo convertir a string para UI:", error)
          return "Fecha inválida"
        }
      }

      // Extraer año, mes y día directamente del string de fecha
      if (fechaStr.includes("T")) {
        const partes = fechaStr.split("T")[0].split("-")
        if (partes.length === 3) {
          // Formato DD/MM/YYYY
          return `${partes[2]}/${partes[1]}/${partes[0]}`
        }
      }

      if (fechaStr.includes("-")) {
        const partes = fechaStr.split("-")
        if (partes.length === 3) {
          // Formato DD/MM/YYYY
          return `${partes[2]}/${partes[1]}/${partes[0]}`
        }
      }

      // Si no se puede extraer del string, usar el método tradicional
      const fecha = new Date(fechaStr)
      if (!isNaN(fecha.getTime())) {
        return fecha.toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }

      return fechaStr // Devolver el string original si no se puede formatear
    } catch (error) {
      console.error("Error al formatear fecha para UI:", error)
      return "Fecha inválida"
    }
  }

  // Función para agrupar tickets por día - memoizada con useCallback
  const agruparTicketsPorDia = useCallback(
    (ticketsToGroup) => {
      // Imprimir información de depuración
      console.log(`Agrupando ${ticketsToGroup.length} tickets por día`)

      // Verificar distribución de géneros
      const machosCount = ticketsToGroup.filter((t) => t.genero === "M").length
      const hembrasCount = ticketsToGroup.filter((t) => t.genero === "H").length
      const otrosCount = ticketsToGroup.filter((t) => t.genero !== "M" && t.genero !== "H").length

      console.log(`Distribución por género: Machos=${machosCount}, Hembras=${hembrasCount}, Otros=${otrosCount}`)

      // Primero filtramos por fecha si hay filtros
      let ticketsFiltrados = [...ticketsToGroup]

      // Imprimir rango de fechas para depuración
      if (ticketsFiltrados.length > 0) {
        // Extraer las fechas originales sin procesar
        const fechasOriginales = ticketsFiltrados.map((t) => t.fecha)
        console.log("Muestra de fechas originales:", fechasOriginales.slice(0, 5))

        // Extraer las fechas procesadas con getFechaKey
        const fechasProcesadas = ticketsFiltrados.map((t) => getFechaKey(t.fecha))
        console.log("Muestra de fechas procesadas:", fechasProcesadas.slice(0, 5))

        // Contar tickets por fecha
        const conteoFechas = {}
        fechasProcesadas.forEach((f) => {
          conteoFechas[f] = (conteoFechas[f] || 0) + 1
        })
        console.log("Conteo de tickets por fecha:", conteoFechas)

        // Verificar rango completo de fechas
        const fechas = ticketsFiltrados.map((t) => new Date(t.fecha))
        const minFecha = new Date(Math.min(...fechas))
        const maxFecha = new Date(Math.max(...fechas))
        console.log(`Rango completo de fechas: ${minFecha.toLocaleDateString()} a ${maxFecha.toLocaleDateString()}`)
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

      console.log(`Después de filtrar por fecha: ${ticketsFiltrados.length} tickets`)

      // Agrupar por día y género
      const porDia = {}

      // También actualizar la parte donde se procesan los tickets para asegurar que la fecha se maneje correctamente
      ticketsFiltrados.forEach((ticket) => {
        // Asegurarse de que ticket.fecha es una fecha válida
        if (!ticket.fecha) return

        // Convertir a objeto Date si es un string
        let fechaObj = ticket.fecha
        if (typeof fechaObj === "string") {
          fechaObj = new Date(fechaObj)
        }

        // Obtener la clave de fecha sin ajustes de zona horaria
        const fechaKey = getFechaKey(fechaObj)

        // Imprimir para depuración
        console.log(
          `Procesando ticket: fecha_original=${ticket.fecha}, fechaKey=${fechaKey}, ticket=${ticket.ticket}, ticket2=${ticket.ticket2}`,
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
            console.log(`Añadido ticket ${ticketNum} a ${genero} para fecha ${fechaKey}`)
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

        // Imprimir para depuración
        console.log(`Día ${dia.fecha}: Machos tickets=${dia.machos.tickets.join(",")}`)
        console.log(`Día ${dia.fecha}: Hembras tickets=${dia.hembras.tickets.join(",")}`)

        dia.machos.ticketsRango =
          dia.machos.tickets.length > 0
            ? `${dia.machos.tickets[0]} - ${dia.machos.tickets[dia.machos.tickets.length - 1]}`
            : ""

        dia.hembras.ticketsRango =
          dia.hembras.tickets.length > 0
            ? `${dia.hembras.tickets[0]} - ${dia.hembras.tickets[dia.hembras.tickets.length - 1]}`
            : ""
      })

      // Convertir a array y ordenar por fecha
      const resultado = Object.values(porDia).sort((a, b) => {
        // Ordenar por fecha original (más reciente primero)
        return new Date(b.fechaOriginal) - new Date(a.fechaOriginal)
      })

      console.log(`Días agrupados: ${resultado.length}`)
      if (resultado.length > 0) {
        console.log(
          `Muestra de días agrupados:`,
          resultado.map((d) => ({
            fecha: d.fecha,
            fechaFormateada: d.fechaFormateada,
            machos: {
              cantidad: d.machos.cantidad,
              tickets:
                d.machos.tickets.length > 0
                  ? `${d.machos.tickets[0]}-${d.machos.tickets[d.machos.tickets.length - 1]}`
                  : "ninguno",
            },
            hembras: {
              cantidad: d.hembras.cantidad,
              tickets:
                d.hembras.tickets.length > 0
                  ? `${d.hembras.tickets[0]}-${d.hembras.tickets[d.hembras.tickets.length - 1]}`
                  : "ninguno",
            },
          })),
        )
      }

      // Calcular estadísticas generales
      const estadisticas = {
        machos: {
          cantidad: resultado.reduce((sum, dia) => sum + dia.machos.cantidad, 0),
          valorTotal: resultado.reduce((sum, dia) => sum + dia.machos.valorTotal, 0),
          valorUnitario: 0, // Inicializar con 0
        },
        hembras: {
          cantidad: resultado.reduce((sum, dia) => sum + dia.hembras.cantidad, 0),
          valorTotal: resultado.reduce((sum, dia) => sum + dia.hembras.valorTotal, 0),
          valorUnitario: 0, // Inicializar con 0
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

      console.log(`Estadísticas calculadas:`, estadisticas)

      return { porDia: resultado, estadisticas }
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
        "Muestra de fechas de tickets:",
        validTickets.slice(0, 5).map((t) => ({
          fecha_original: t.fecha,
          fecha_procesada: getFechaKey(t.fecha),
          fecha_formateada: formatFechaParaUI(t.fecha),
          ticket: t.ticket,
          ticket2: t.ticket2,
        })),
      )

      // Verificar rango completo de fechas
      const fechas = validTickets.map((t) => new Date(t.fecha))
      const minFecha = new Date(Math.min(...fechas))
      const maxFecha = new Date(Math.max(...fechas))
      console.log(
        `Rango completo de fechas en tickets: ${minFecha.toLocaleDateString()} a ${maxFecha.toLocaleDateString()}`,
      )
      console.log(`Total de tickets recibidos: ${validTickets.length}`)
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
