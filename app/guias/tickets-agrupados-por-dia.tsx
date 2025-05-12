"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ExportTicketsAgrupadosButtons from "./export-tickets-agrupados-buttons"

interface Ticket {
  id: string
  ticket: string
  ticket2: string
  fecha: string
  genero: string
  valor: number
  kilos: number
}

export default function TicketsAgrupadosPorDia({ tickets, tipo, fechaDesde, fechaHasta }) {
  const [ticketsAgrupados, setTicketsAgrupados] = useState<any[]>([])
  const [debug, setDebug] = useState<any>({})

  useEffect(() => {
    // Función para normalizar la fecha y evitar problemas de zona horaria
    const normalizarFecha = (fechaStr: string) => {
      // Asegurarse de que la fecha es válida
      if (!fechaStr) return null

      try {
        // Crear objeto Date
        const fecha = new Date(fechaStr)

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
          console.error("Fecha inválida:", fechaStr)
          return null
        }

        // Normalizar a formato YYYY-MM-DD
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
      } catch (error) {
        console.error("Error al procesar fecha:", fechaStr, error)
        return null
      }
    }

    // Agrupar tickets por día
    const agruparPorDia = () => {
      // Objeto para depuración
      const debugInfo = {
        totalTickets: tickets.length,
        fechasInvalidas: 0,
        distribucionPorDia: {},
        muestras: tickets.slice(0, 5).map((t) => ({
          id: t.id,
          ticket: t.ticket,
          ticket2: t.ticket2,
          fecha_original: t.fecha,
          fecha_normalizada: normalizarFecha(t.fecha),
          genero: t.genero,
        })),
      }

      const agrupados: Record<string, any> = {}

      tickets.forEach((ticket) => {
        // Normalizar la fecha
        const fechaKey = normalizarFecha(ticket.fecha)

        if (!fechaKey) {
          debugInfo.fechasInvalidas++
          return
        }

        // Formatear para mostrar
        const fecha = new Date(fechaKey)
        const fechaFormateada = `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`

        // Inicializar el grupo si no existe
        if (!agrupados[fechaKey]) {
          agrupados[fechaKey] = {
            fecha: fechaFormateada,
            fechaKey: fechaKey, // Guardar la clave para ordenar después
            machos: {
              tickets: [],
              cantidad: 0,
              valorTotal: 0,
            },
            hembras: {
              tickets: [],
              cantidad: 0,
              valorTotal: 0,
            },
          }

          // Para depuración
          debugInfo.distribucionPorDia[fechaKey] = 0
        }

        debugInfo.distribucionPorDia[fechaKey]++

        // Determinar el género y agregar al grupo correspondiente
        const genero = ticket.genero?.toString().trim().toUpperCase()
        const grupo = genero === "M" || genero === "MACHO" ? "machos" : "hembras"

        // Usar ticket2 si está disponible, de lo contrario usar ticket
        const ticketNum = ticket.ticket2 || ticket.ticket
        if (ticketNum) {
          agrupados[fechaKey][grupo].tickets.push(Number(ticketNum))
        }

        agrupados[fechaKey][grupo].cantidad += 1
        agrupados[fechaKey][grupo].valorTotal += Number(ticket.valor || 0)
      })

      // Calcular rangos de tickets y valores unitarios
      Object.values(agrupados).forEach((grupo) => {
        // Ordenar tickets para obtener rango
        grupo.machos.tickets.sort((a: number, b: number) => a - b)
        grupo.hembras.tickets.sort((a: number, b: number) => a - b)

        // Calcular rangos
        grupo.machos.rango =
          grupo.machos.tickets.length > 0
            ? `${grupo.machos.tickets[0]} - ${grupo.machos.tickets[grupo.machos.tickets.length - 1]}`
            : "N/A"

        grupo.hembras.rango =
          grupo.hembras.tickets.length > 0
            ? `${grupo.hembras.tickets[0]} - ${grupo.hembras.tickets[grupo.hembras.tickets.length - 1]}`
            : "N/A"

        // Calcular valores unitarios
        grupo.machos.valorUnitario = grupo.machos.cantidad > 0 ? grupo.machos.valorTotal / grupo.machos.cantidad : 0

        grupo.hembras.valorUnitario = grupo.hembras.cantidad > 0 ? grupo.hembras.valorTotal / grupo.hembras.cantidad : 0
      })

      // Guardar información de depuración
      setDebug(debugInfo)

      // Convertir a array y ordenar por fecha (más reciente primero)
      return Object.values(agrupados).sort((a, b) => {
        return b.fechaKey.localeCompare(a.fechaKey) // Ordenar por la clave de fecha normalizada
      })
    }

    setTicketsAgrupados(agruparPorDia())
  }, [tickets])

  // Calcular totales
  const totales = {
    machos: {
      cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.machos.cantidad, 0),
      valorTotal: ticketsAgrupados.reduce((sum, item) => sum + item.machos.valorTotal, 0),
    },
    hembras: {
      cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.cantidad, 0),
      valorTotal: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.valorTotal, 0),
    },
  }

  totales.machos.valorUnitario = totales.machos.cantidad > 0 ? totales.machos.valorTotal / totales.machos.cantidad : 0

  totales.hembras.valorUnitario =
    totales.hembras.cantidad > 0 ? totales.hembras.valorTotal / totales.hembras.cantidad : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tickets Agrupados por Día</CardTitle>
        <ExportTicketsAgrupadosButtons tipo={tipo} agrupacion="dia" fechaDesde={fechaDesde} fechaHasta={fechaHasta} />
      </CardHeader>
      <CardContent>
        {/* Información de depuración - solo visible en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
            <p>Total tickets: {debug.totalTickets}</p>
            <p>Fechas inválidas: {debug.fechasInvalidas}</p>
            <p>Distribución por día: {JSON.stringify(debug.distribucionPorDia)}</p>
            <p>Muestras: {JSON.stringify(debug.muestras)}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} className="border">
                  Fecha
                </TableHead>
                <TableHead colSpan={4} className="text-center border bg-blue-50">
                  Machos
                </TableHead>
                <TableHead colSpan={4} className="text-center border bg-pink-50">
                  Hembras
                </TableHead>
              </TableRow>
              <TableRow>
                {/* Columnas para Machos */}
                <TableHead className="border bg-blue-50">Tickets (Rango)</TableHead>
                <TableHead className="text-right border bg-blue-50">Cantidad</TableHead>
                <TableHead className="text-right border bg-blue-50">Valor Unitario</TableHead>
                <TableHead className="text-right border bg-blue-50">Valor Total</TableHead>

                {/* Columnas para Hembras */}
                <TableHead className="border bg-pink-50">Tickets (Rango)</TableHead>
                <TableHead className="text-right border bg-pink-50">Cantidad</TableHead>
                <TableHead className="text-right border bg-pink-50">Valor Unitario</TableHead>
                <TableHead className="text-right border bg-pink-50">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketsAgrupados.map((grupo, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium border">{grupo.fecha}</TableCell>

                  {/* Datos de Machos */}
                  <TableCell className="border">{grupo.machos.rango}</TableCell>
                  <TableCell className="text-right border">{grupo.machos.cantidad}</TableCell>
                  <TableCell className="text-right border">
                    {grupo.machos.valorUnitario.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                  </TableCell>
                  <TableCell className="text-right border">
                    {grupo.machos.valorTotal.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                  </TableCell>

                  {/* Datos de Hembras */}
                  <TableCell className="border">{grupo.hembras.rango}</TableCell>
                  <TableCell className="text-right border">{grupo.hembras.cantidad}</TableCell>
                  <TableCell className="text-right border">
                    {grupo.hembras.valorUnitario.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                  </TableCell>
                  <TableCell className="text-right border">
                    {grupo.hembras.valorTotal.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                  </TableCell>
                </TableRow>
              ))}

              {/* Fila de totales */}
              <TableRow className="bg-gray-100 font-bold">
                <TableCell className="border">TOTALES</TableCell>

                {/* Totales de Machos */}
                <TableCell className="border">-</TableCell>
                <TableCell className="text-right border">{totales.machos.cantidad}</TableCell>
                <TableCell className="text-right border">
                  {totales.machos.valorUnitario.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                </TableCell>
                <TableCell className="text-right border">
                  {totales.machos.valorTotal.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                </TableCell>

                {/* Totales de Hembras */}
                <TableCell className="border">-</TableCell>
                <TableCell className="text-right border">{totales.hembras.cantidad}</TableCell>
                <TableCell className="text-right border">
                  {totales.hembras.valorUnitario.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                </TableCell>
                <TableCell className="text-right border">
                  {totales.hembras.valorTotal.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
