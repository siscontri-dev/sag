"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Eye, FileEdit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SacrificiosTable({ sacrificios = [] }) {
  const router = useRouter()
  const [sortConfig, setSortConfig] = useState({
    key: "fecha_documento",
    direction: "desc",
  })

  // Función para ordenar los datos
  const sortedSacrificios = [...sacrificios].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1
    }
    return 0
  })

  // Función para cambiar el ordenamiento
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Función para ver el detalle de un sacrificio
  const handleView = (id) => {
    router.push(`/sacrificios/ver/${id}`)
  }

  // Función para formatear números sin decimales y con coma como separador de miles
  const formatNumber = (value) => {
    // Asegurarse de que el valor sea un número válido
    const numValue = Number.parseFloat(value || 0)

    // Verificar si es un número válido
    if (isNaN(numValue)) return "0"

    return Math.round(numValue)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => requestSort("numero_documento")}>
              Número
              {sortConfig.key === "numero_documento" && <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort("fecha_documento")}>
              Fecha
              {sortConfig.key === "fecha_documento" && <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
            </TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead className="text-center">Machos</TableHead>
            <TableHead className="text-center">Hembras</TableHead>
            <TableHead className="text-center">Total M+H</TableHead>
            <TableHead className="text-center">Kilos</TableHead>
            <TableHead className="text-right">Degüello</TableHead>
            <TableHead className="text-right">Fondo</TableHead>
            <TableHead className="text-right">Matadero</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSacrificios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center py-4">
                No hay sacrificios registrados
              </TableCell>
            </TableRow>
          ) : (
            sortedSacrificios.map((sacrificio) => {
              // Asegurarse de que todos los valores numéricos sean números válidos
              const quantityM = Number.parseInt(sacrificio.quantity_m || 0, 10)
              const quantityH = Number.parseInt(sacrificio.quantity_h || 0, 10)
              const quantityK = Number.parseInt(sacrificio.quantity_k || 0, 10)
              const impuesto1 = Number.parseFloat(sacrificio.impuesto1 || 0)
              const impuesto2 = Number.parseFloat(sacrificio.impuesto2 || 0)
              const impuesto3 = Number.parseFloat(sacrificio.impuesto3 || 0)
              const total = Number.parseFloat(sacrificio.total || 0)

              return (
                <TableRow key={sacrificio.id}>
                  <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                  <TableCell>{formatDate(sacrificio.fecha_documento)}</TableCell>
                  <TableCell>{sacrificio.dueno_anterior_nombre}</TableCell>
                  <TableCell className="text-center">{formatNumber(quantityM)}</TableCell>
                  <TableCell className="text-center">{formatNumber(quantityH)}</TableCell>
                  <TableCell className="text-center">{formatNumber(quantityM + quantityH)}</TableCell>
                  <TableCell className="text-center">{formatNumber(quantityK)}</TableCell>
                  <TableCell className="text-right">{formatNumber(impuesto1)}</TableCell>
                  <TableCell className="text-right">{formatNumber(impuesto2)}</TableCell>
                  <TableCell className="text-right">{formatNumber(impuesto3)}</TableCell>
                  <TableCell className="text-right">{formatNumber(total)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        sacrificio.estado === "confirmado"
                          ? "bg-green-100 text-green-800"
                          : sacrificio.estado === "anulado"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {sacrificio.estado === "confirmado"
                        ? "Confirmado"
                        : sacrificio.estado === "anulado"
                          ? "Anulado"
                          : "Borrador"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(sacrificio.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/sacrificios/editar/${sacrificio.id}`}>
                          <FileEdit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
