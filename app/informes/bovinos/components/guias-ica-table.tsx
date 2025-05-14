"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Interfaz para los datos de guías ICA
interface GuiaIcaItem {
  id: string
  fecha: string
  numeroGuia: string
  propietario: string
  procedencia: string
  destino: string
  cantidadTotal: number
  cantidadMachos: number
  cantidadHembras: number
}

interface GuiasIcaTableProps {
  data: GuiaIcaItem[]
}

export function GuiasIcaTable({ data }: GuiasIcaTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar los datos según el término de búsqueda
  const filteredData = data.filter(
    (item) =>
      item.numeroGuia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.propietario && item.propietario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.fecha && item.fecha.includes(searchTerm)) ||
      (item.procedencia && item.procedencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.destino && item.destino.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calcular totales
  const totales = filteredData.reduce(
    (acc, item) => {
      acc.cantidadTotal += item.cantidadTotal
      acc.cantidadMachos += item.cantidadMachos
      acc.cantidadHembras += item.cantidadHembras
      return acc
    },
    {
      cantidadTotal: 0,
      cantidadMachos: 0,
      cantidadHembras: 0,
    },
  )

  // Depurar fechas
  console.log(
    "Fechas originales de guías ICA:",
    data.map((g) => ({
      id: g.id,
      fecha_original: g.fecha,
    })),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar por número de guía, propietario, fecha, procedencia o destino..."
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
              <TableHead>Procedencia</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Machos</TableHead>
              <TableHead className="text-right">Hembras</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.fecha}</TableCell>
                    <TableCell>{item.numeroGuia}</TableCell>
                    <TableCell>{item.propietario}</TableCell>
                    <TableCell>{item.procedencia}</TableCell>
                    <TableCell>{item.destino}</TableCell>
                    <TableCell className="text-right">{item.cantidadTotal}</TableCell>
                    <TableCell className="text-right">{item.cantidadMachos}</TableCell>
                    <TableCell className="text-right">{item.cantidadHembras}</TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="font-bold">
                  <TableCell colSpan={5}>TOTALES</TableCell>
                  <TableCell className="text-right">{totales.cantidadTotal}</TableCell>
                  <TableCell className="text-right">{totales.cantidadMachos}</TableCell>
                  <TableCell className="text-right">{totales.cantidadHembras}</TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
