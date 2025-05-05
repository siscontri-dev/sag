"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"

export default function SacrificiosTable({ sacrificios = [] }) {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">Número</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Propietario</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">Kilos</TableHead>
            <TableHead className="font-semibold">Total</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
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
            sacrificios.map((sacrificio, index) => (
              <TableRow key={sacrificio.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium">{sacrificio.numero_documento}</TableCell>
                <TableCell>{formatDate(sacrificio.fecha_documento)}</TableCell>
                <TableCell>{sacrificio.dueno_anterior_nombre || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        sacrificio.estado === "confirmado"
                          ? themeColors.estado.confirmado.bg
                          : sacrificio.estado === "anulado"
                            ? themeColors.estado.anulado.bg
                            : themeColors.estado.borrador.bg,
                      color:
                        sacrificio.estado === "confirmado"
                          ? themeColors.estado.confirmado.text
                          : sacrificio.estado === "anulado"
                            ? themeColors.estado.anulado.text
                            : themeColors.estado.borrador.text,
                    }}
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
                <TableCell className="font-medium">{formatCurrency(sacrificio.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                      <Link href={`/sacrificios/ver/${sacrificio.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
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
