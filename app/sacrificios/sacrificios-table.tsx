"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Edit, Eye } from "lucide-react"

const themeColors = {
  estado: {
    confirmado: {
      bg: "#dcfce7",
      text: "#16a34a",
    },
    anulado: {
      bg: "#fee2e2",
      text: "#dc2626",
    },
    borrador: {
      bg: "#fffbeb",
      text: "#d97706",
    },
  },
}

const formatDate = (date: Date | string): string => {
  if (typeof date === "string") {
    date = new Date(date)
  }
  return date.toLocaleDateString("es-CO")
}

export default function SacrificiosTable({ sacrificios = [], tipoAnimal = "bovino", contactosNuevos = [] }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Modificar la función de filtrado para incluir la marca
  const filteredSacrificios = sacrificios.filter((sacrificio) => {
    // Obtener la marca del dueño nuevo si existe
    const dueno_nuevo = contactosNuevos?.find((c) => c.id === sacrificio.id_dueno_nuevo)
    const marca = dueno_nuevo?.marca || ""

    const searchString =
      `${sacrificio.numero_documento} ${sacrificio.dueno_anterior_nombre} ${sacrificio.consignante || ""} ${sacrificio.planilla || ""} ${marca}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Sacrificios de {tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"}</CardTitle>
        <div className="flex items-center mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por número, dueño, consignante, planilla o marca..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold">Guía</TableHead>
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Propietario</TableHead>
                <TableHead className="font-semibold">Animales</TableHead>
                <TableHead className="font-semibold">Kilos</TableHead>
                <TableHead className="font-semibold">Degüello</TableHead>
                <TableHead className="font-semibold">Fondo</TableHead>
                <TableHead className="font-semibold">Matadero</TableHead>
                <TableHead className="font-semibold">Refrigeración</TableHead>
                <TableHead className="font-semibold">Horas Extras</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Total</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sacrificios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-24 text-center">
                    No se encontraron sacrificios
                  </TableCell>
                </TableRow>
              ) : (
                sacrificios.map((sacrificio) => (
                  <TableRow key={sacrificio.id} className="border-b hover:bg-gray-50">
                    <TableCell className="px-4 py-2">{sacrificio.numero_documento}</TableCell>
                    <TableCell className="px-4 py-2">{formatDate(sacrificio.fecha_documento)}</TableCell>
                    <TableCell className="px-4 py-2">{sacrificio.dueno_anterior_nombre}</TableCell>
                    <TableCell className="px-4 py-2">
                      {sacrificio.quantity_m + sacrificio.quantity_h} ({sacrificio.quantity_m}M/{sacrificio.quantity_h}
                      H)
                    </TableCell>
                    <TableCell className="px-4 py-2">{sacrificio.quantity_k} kg</TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.impuesto1 || 0)}</TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.impuesto2 || 0)}</TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.impuesto3 || 0)}</TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.refrigeration || 0)}</TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.extra_hour || 0)}</TableCell>
                    <TableCell className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          sacrificio.estado === "confirmado"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {sacrificio.estado === "confirmado" ? "Confirmado" : "Borrador"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">{formatCurrency(sacrificio.total)}</TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <Link href={`/sacrificios/ver/${sacrificio.id}`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/sacrificios/editar/${sacrificio.id}`}
                          className="text-amber-600 hover:text-amber-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
