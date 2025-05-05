"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function SacrificiosTable({ sacrificios = [] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Kilos</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sacrificios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron sacrificios.
              </TableCell>
            </TableRow>
          ) : (
            sacrificios.map((sacrificio) => (
              <TableRow key={sacrificio.id}>
                <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                <TableCell>{formatDate(sacrificio.fecha_documento)}</TableCell>
                <TableCell>{sacrificio.dueno_anterior_nombre || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sacrificio.estado === "confirmado"
                        ? "default"
                        : sacrificio.estado === "anulado"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {sacrificio.estado === "confirmado"
                      ? "Confirmado"
                      : sacrificio.estado === "anulado"
                        ? "Anulado"
                        : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sacrificio.transaction_lines
                    ? sacrificio.transaction_lines
                        .reduce((sum, line) => sum + (line.quantity || 0), 0)
                        .toLocaleString("es-CO")
                    : "0"}{" "}
                  kg
                </TableCell>
                <TableCell>{formatCurrency(sacrificio.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/sacrificios/ver/${sacrificio.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/sacrificios/editar/${sacrificio.id}`}>
                        <Edit className="h-4 w-4" />
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
