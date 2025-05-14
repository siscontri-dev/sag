"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

// Interfaz para los datos de degüello
interface DeguelloItem {
  id: string
  fecha: string
  numeroGuia: string
  propietario: string
  cantidadTotal: number
  cantidadMachos: number
  cantidadHembras: number
  valorDeguello: number
  valorFondo: number
  valorMatadero: number
  total: number
}

interface DeguellosTableProps {
  data: DeguelloItem[]
}

export function DeguellosTable({ data }: DeguellosTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar los datos según el término de búsqueda
  const filteredData = data.filter(
    (item) =>
      item.numeroGuia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.propietario && item.propietario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.fecha && item.fecha.includes(searchTerm)),
  )

  // Calcular totales
  const totales = filteredData.reduce(
    (acc, item) => {
      acc.cantidadTotal += item.cantidadTotal
      acc.cantidadMachos += item.cantidadMachos
      acc.cantidadHembras += item.cantidadHembras
      acc.valorDeguello += item.valorDeguello
      acc.valorFondo += item.valorFondo
      acc.valorMatadero += item.valorMatadero
      acc.total += item.total
      return acc
    },
    {
      cantidadTotal: 0,
      cantidadMachos: 0,
      cantidadHembras: 0,
      valorDeguello: 0,
      valorFondo: 0,
      valorMatadero: 0,
      total: 0,
    },
  )

  // Depurar fechas
  console.log(
    "Fechas originales de degüellos (porcinos):",
    data.slice(0, 5).map((s) => ({
      id: s.id,
      fecha_original: s.fecha,
      propietario: s.propietario,
      numeroGuia: s.numeroGuia,
    })),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar por número de guía, propietario o fecha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Guía</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Machos</TableHead>
              <TableHead className="text-right">Hembras</TableHead>
              <TableHead className="text-right">Degüello</TableHead>
              <TableHead className="text-right">Fondo</TableHead>
              <TableHead className="text-right">Matadero</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fecha || "Sin fecha"}</TableCell>
                    <TableCell>{item.numeroGuia}</TableCell>
                    <TableCell>{item.propietario}</TableCell>
                    <TableCell className="text-right">{item.cantidadTotal}</TableCell>
                    <TableCell className="text-right">{item.cantidadMachos}</TableCell>
                    <TableCell className="text-right">{item.cantidadHembras}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valorDeguello)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valorFondo)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.valorMatadero)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="font-bold">
                  <TableCell colSpan={3}>TOTALES</TableCell>
                  <TableCell className="text-right">{totales.cantidadTotal}</TableCell>
                  <TableCell className="text-right">{totales.cantidadMachos}</TableCell>
                  <TableCell className="text-right">{totales.cantidadHembras}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totales.valorDeguello)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totales.valorFondo)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totales.valorMatadero)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totales.total)}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
