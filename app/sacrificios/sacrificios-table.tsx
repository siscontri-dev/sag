"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SacrificiosTable({ sacrificios = [], tipoAnimal = "bovino" }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar sacrificios por término de búsqueda
  const filteredSacrificios = sacrificios.filter((sacrificio) => {
    const searchString =
      `${sacrificio.numero_documento} ${sacrificio.dueno_anterior_nombre} ${sacrificio.consignante || ""} ${sacrificio.planilla || ""}`.toLowerCase()
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
              placeholder="Buscar por número, dueño, consignante o planilla..."
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
            <TableHeader>
              <TableRow>
                <TableHead>Guía</TableHead>
                <TableHead>Consec</TableHead>
                <TableHead>Planilla</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Dueño Anterior</TableHead>
                <TableHead>Consignante</TableHead>
                <TableHead>Recibos báscula</TableHead>
                <TableHead>Machos</TableHead>
                <TableHead>Hembras</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Kilos</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSacrificios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-4">
                    No hay sacrificios registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredSacrificios.map((sacrificio) => (
                  <TableRow key={sacrificio.id}>
                    <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                    <TableCell>{sacrificio.consec || "-"}</TableCell>
                    <TableCell>{sacrificio.planilla || "-"}</TableCell>
                    <TableCell>
                      {new Date(sacrificio.fecha_documento).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{sacrificio.dueno_anterior_nombre}</TableCell>
                    <TableCell>{sacrificio.consignante || "-"}</TableCell>
                    <TableCell>{sacrificio.observaciones || "-"}</TableCell>
                    <TableCell className="text-center">{sacrificio.quantity_m}</TableCell>
                    <TableCell className="text-center">{sacrificio.quantity_h}</TableCell>
                    <TableCell className="text-center">
                      {Number(sacrificio.quantity_m) + Number(sacrificio.quantity_h)}
                    </TableCell>
                    <TableCell className="text-center">{sacrificio.quantity_k}</TableCell>
                    <TableCell>{formatCurrency(sacrificio.total)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sacrificios/ver/${sacrificio.id}`}>Ver</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/sacrificios/editar/${sacrificio.id}`}>Editar</Link>
                        </Button>
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
