"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
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
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSacrificios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No hay sacrificios registrados
              </TableCell>
            </TableRow>
          ) : (
            sortedSacrificios.map((sacrificio) => (
              <TableRow key={sacrificio.id}>
                <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                <TableCell>{formatDate(sacrificio.fecha_documento)}</TableCell>
                <TableCell>{sacrificio.dueno_anterior_nombre}</TableCell>
                <TableCell className="text-right">{formatCurrency(sacrificio.total)}</TableCell>
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
