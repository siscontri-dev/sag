"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { type BoletinGanadoItem, getBoletinGanadoMayor } from "@/app/informes/actions"
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

export function BoletinGanadoMayor({
  fechaInicio,
  fechaFin,
}: {
  fechaInicio: string
  fechaFin: string
}) {
  const [datos, setDatos] = useState<BoletinGanadoItem[]>([])
  const [totales, setTotales] = useState({
    cantidadTotal: 0,
    cantidadMachos: 0,
    cantidadHembras: 0,
    cantidadKilos: 0,
    valorDeguello: 0,
    servicioMatadero: 0,
    fondoFedegan: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)

  // Cargar datos reales
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        const datosInforme = await getBoletinGanadoMayor(fechaInicio, fechaFin)
        setDatos(datosInforme)

        // Calcular totales
        const nuevosTotales = datosInforme.reduce(
          (acc, item) => {
            return {
              cantidadTotal: acc.cantidadTotal + item.cantidadTotal,
              cantidadMachos: acc.cantidadMachos + item.cantidadMachos,
              cantidadHembras: acc.cantidadHembras + item.cantidadHembras,
              cantidadKilos: acc.cantidadKilos + item.cantidadKilos,
              valorDeguello: acc.valorDeguello + item.valorDeguello,
              servicioMatadero: acc.servicioMatadero + item.servicioMatadero,
              fondoFedegan: acc.fondoFedegan + item.fondoFedegan,
              total: acc.total + item.total,
            }
          },
          {
            cantidadTotal: 0,
            cantidadMachos: 0,
            cantidadHembras: 0,
            cantidadKilos: 0,
            valorDeguello: 0,
            servicioMatadero: 0,
            fondoFedegan: 0,
            total: 0,
          },
        )

        setTotales(nuevosTotales)
      } catch (error) {
        console.error("Error al cargar datos del boletín:", error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [fechaInicio, fechaFin])

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
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="border">Fecha</TableHead>
                <TableHead className="border">G/Deguello</TableHead>
                <TableHead className="text-center border">Cantidad Total</TableHead>
                <TableHead className="text-center border">Machos</TableHead>
                <TableHead className="text-center border">Hembras</TableHead>
                <TableHead className="text-center border">Kilos</TableHead>
                <TableHead className="text-right border">Valor Deguello</TableHead>
                <TableHead className="text-right border">Servicio Matadero</TableHead>
                <TableHead className="text-right border">Fondo Fedegan</TableHead>
                <TableHead className="text-right border">Total</TableHead>
                <TableHead className="text-center border">Boletín Nº</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="border">{new Date(item.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell className="border">{item.numeroGuiaIca}</TableCell>
                  <TableCell className="text-center border">{item.cantidadTotal}</TableCell>
                  <TableCell className="text-center border">{item.cantidadMachos}</TableCell>
                  <TableCell className="text-center border">{item.cantidadHembras}</TableCell>
                  <TableCell className="text-center border">{formatNumber(item.cantidadKilos)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.valorDeguello)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.servicioMatadero)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.fondoFedegan)}</TableCell>
                  <TableCell className="text-right border font-bold">{formatNumber(item.total)}</TableCell>
                  <TableCell className="text-center border">{item.numeroBoletin}</TableCell>
                </TableRow>
              ))}

              {/* Fila de totales */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="border font-bold">
                  TOTALES
                </TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadTotal}</TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadMachos}</TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadHembras}</TableCell>
                <TableCell className="text-center border font-bold">{formatNumber(totales.cantidadKilos)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.valorDeguello)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.servicioMatadero)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.fondoFedegan)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.total)}</TableCell>
                <TableCell className="border"></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Sección de distribución del impuesto de deguello */}
          <div className="mt-8 p-4 border rounded-lg">
            <h3 className="text-lg font-bold mb-4">Distribución del Impuesto de Deguello</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Total Impuesto Deguello</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Alcaldía (50%)</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello / 2)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Gobernación (50%)</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello / 2)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
