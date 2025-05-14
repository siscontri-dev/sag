"use client"

import { useState } from "react"
import type { IcaItem } from "./actions"

interface IcaTableProps {
  data: IcaItem[]
  tipoAnimal: "bovinos" | "porcinos"
}

export function IcaTable({ data, tipoAnimal }: IcaTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar datos según el término de búsqueda
  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.numeroGuia.toLowerCase().includes(searchLower) ||
      item.propietario.toLowerCase().includes(searchLower) ||
      item.fecha.includes(searchTerm)
    )
  })

  // Calcular totales
  const totales = filteredData.reduce(
    (acc, item) => {
      acc.machos += item.machos
      acc.hembras += item.hembras
      acc.totalAnimales += item.totalAnimales
      acc.kilos += item.kilos
      acc.total += item.total
      return acc
    },
    {
      machos: 0,
      hembras: 0,
      totalAnimales: 0,
      kilos: 0,
      total: 0,
    },
  )

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lista ICA - {tipoAnimal === "bovinos" ? "Bovinos" : "Porcinos"}</h1>

      {/* Buscador */}
      <div className="flex w-full max-w-sm items-center space-x-2">
        <input
          type="text"
          placeholder="Buscar por guía, propietario o fecha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nº Guía</th>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Propietario</th>
                <th className="px-4 py-3 text-right font-medium">Machos</th>
                <th className="px-4 py-3 text-right font-medium">Hembras</th>
                <th className="px-4 py-3 text-right font-medium">Total Animales</th>
                <th className="px-4 py-3 text-right font-medium">Kilos</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                <>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">{item.numeroGuia}</td>
                      <td className="px-4 py-3">{item.fecha}</td>
                      <td className="px-4 py-3">{item.propietario}</td>
                      <td className="px-4 py-3 text-right">{item.machos}</td>
                      <td className="px-4 py-3 text-right">{item.hembras}</td>
                      <td className="px-4 py-3 text-right">{item.totalAnimales}</td>
                      <td className="px-4 py-3 text-right">{item.kilos.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr className="border-t bg-muted/50 font-medium">
                    <td colSpan={3} className="px-4 py-3 text-right">
                      Totales:
                    </td>
                    <td className="px-4 py-3 text-right">{totales.machos}</td>
                    <td className="px-4 py-3 text-right">{totales.hembras}</td>
                    <td className="px-4 py-3 text-right">{totales.totalAnimales}</td>
                    <td className="px-4 py-3 text-right">{totales.kilos.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(totales.total)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center">
                    No se encontraron registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
