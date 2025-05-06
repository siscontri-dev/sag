"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { type InformeDiarioItem, getInformeDiarioBasculaCorralaje } from "@/app/informes/actions"
import { Skeleton } from "@/components/ui/skeleton"

// Función para formatear números como moneda sin símbolo y sin decimales
function formatNumber(value: number): string {
  if (isNaN(value)) return "0"
  return value
    .toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\./g, ",")
}

export function InformeDiarioBasculaCorralaje({
  tipo,
  fechaInicio,
  fechaFin,
}: {
  tipo: "bovino" | "porcino"
  fechaInicio: string
  fechaFin: string
}) {
  const [datos, setDatos] = useState<InformeDiarioItem[]>([])
  const [totales, setTotales] = useState({
    cantidadGM: 0,
    totalGM: 0,
    cantidadGMen: 0,
    totalGMen: 0,
    cantidadCorralaje: 0,
    totalCorralaje: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  // Cargar datos reales
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        const datosInforme = await getInformeDiarioBasculaCorralaje(tipo, fechaInicio, fechaFin)
        setDatos(datosInforme)

        // Calcular totales
        const nuevosTotales = datosInforme.reduce(
          (acc, item) => {
            return {
              cantidadGM: acc.cantidadGM + item.cantidadGM,
              totalGM: acc.totalGM + item.totalGM,
              cantidadGMen: acc.cantidadGMen + item.cantidadGMen,
              totalGMen: acc.totalGMen + item.totalGMen,
              cantidadCorralaje: acc.cantidadCorralaje + item.cantidadCorralaje,
              totalCorralaje: acc.totalCorralaje + item.totalCorralaje,
              total: acc.total + item.total,
            }
          },
          {
            cantidadGM: 0,
            totalGM: 0,
            cantidadGMen: 0,
            totalGMen: 0,
            cantidadCorralaje: 0,
            totalCorralaje: 0,
            total: 0,
          },
        )

        setTotales(nuevosTotales)
      } catch (error) {
        console.error("Error al cargar datos del informe:", error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [tipo, fechaInicio, fechaFin])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {datos.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-lg text-muted-foreground">No hay datos disponibles para el período seleccionado.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2} className="border">
                Fecha
              </TableHead>
              <TableHead colSpan={4} className="text-center border">
                G/M
              </TableHead>
              <TableHead colSpan={4} className="text-center border">
                G/Men
              </TableHead>
              <TableHead colSpan={4} className="text-center border">
                Corralaje
              </TableHead>
              <TableHead rowSpan={2} className="text-right border">
                Total
              </TableHead>
              <TableHead rowSpan={2} className="text-center border">
                Info Nº
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead className="border">Tickets</TableHead>
              <TableHead className="text-center border">Cant</TableHead>
              <TableHead className="text-right border">Vlr Unit</TableHead>
              <TableHead className="text-right border">Total G/M</TableHead>

              <TableHead className="border">Tickets</TableHead>
              <TableHead className="text-center border">Cant</TableHead>
              <TableHead className="text-right border">Vlr Unit</TableHead>
              <TableHead className="text-right border">Total G/Men</TableHead>

              <TableHead className="border">Tickets</TableHead>
              <TableHead className="text-center border">Cant</TableHead>
              <TableHead className="text-right border">Vlr Unit</TableHead>
              <TableHead className="text-right border">Total Cor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datos.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="border">{new Date(item.fecha).toLocaleDateString("es-CO")}</TableCell>

                <TableCell className="border">{item.ticketsGM}</TableCell>
                <TableCell className="text-center border">{item.cantidadGM}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.valorUnitarioGM)}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.totalGM)}</TableCell>

                <TableCell className="border">{item.ticketsGMen}</TableCell>
                <TableCell className="text-center border">{item.cantidadGMen}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.valorUnitarioGMen)}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.totalGMen)}</TableCell>

                <TableCell className="border">{item.ticketsCorralaje}</TableCell>
                <TableCell className="text-center border">{item.cantidadCorralaje}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.valorUnitarioCorralaje)}</TableCell>
                <TableCell className="text-right border">{formatNumber(item.totalCorralaje)}</TableCell>

                <TableCell className="text-right border font-bold">{formatNumber(item.total)}</TableCell>
                <TableCell className="text-center border">{item.numeroInforme}</TableCell>
              </TableRow>
            ))}

            {/* Fila de totales */}
            <TableRow className="bg-muted/50">
              <TableCell className="border font-bold">TOTALES</TableCell>

              <TableCell className="border"></TableCell>
              <TableCell className="text-center border font-bold">{totales.cantidadGM}</TableCell>
              <TableCell className="text-right border"></TableCell>
              <TableCell className="text-right border font-bold">{formatNumber(totales.totalGM)}</TableCell>

              <TableCell className="border"></TableCell>
              <TableCell className="text-center border font-bold">{totales.cantidadGMen}</TableCell>
              <TableCell className="text-right border"></TableCell>
              <TableCell className="text-right border font-bold">{formatNumber(totales.totalGMen)}</TableCell>

              <TableCell className="border"></TableCell>
              <TableCell className="text-center border font-bold">{totales.cantidadCorralaje}</TableCell>
              <TableCell className="text-right border"></TableCell>
              <TableCell className="text-right border font-bold">{formatNumber(totales.totalCorralaje)}</TableCell>

              <TableCell className="text-right border font-bold">{formatNumber(totales.total)}</TableCell>
              <TableCell className="text-center border"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  )
}
