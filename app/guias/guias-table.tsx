"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"

export default function GuiasTable({ guias = [] }) {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">Número</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Dueño Anterior</TableHead>
            <TableHead className="font-semibold">Dueño Nuevo</TableHead>
            <TableHead className="font-semibold">Machos</TableHead>
            <TableHead className="font-semibold">Hembras</TableHead>
            <TableHead className="font-semibold">Kilos</TableHead>
            <TableHead className="font-semibold">Estado</TableHead>
            <TableHead className="font-semibold">Total</TableHead>
            <TableHead className="text-right font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                No se encontraron guías.
              </TableCell>
            </TableRow>
          ) : (
            guias.map((guia, index) => (
              <TableRow key={guia.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TableCell className="font-medium">{guia.numero_documento}</TableCell>
                <TableCell>{formatDate(guia.fecha_documento)}</TableCell>
                <TableCell>{guia.dueno_anterior_nombre || "N/A"}</TableCell>
                <TableCell>{guia.dueno_nuevo_nombre || "N/A"}</TableCell>
                <TableCell>{guia.quantity_m || 0}</TableCell>
                <TableCell>{guia.quantity_h || 0}</TableCell>
                <TableCell>{guia.quantity_k ? `${guia.quantity_k.toLocaleString("es-CO")} kg` : "0 kg"}</TableCell>
                <TableCell>
                  <Badge
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor:
                        guia.estado === "confirmado"
                          ? themeColors.estado.confirmado.bg
                          : guia.estado === "anulado"
                            ? themeColors.estado.anulado.bg
                            : themeColors.estado.borrador.bg,
                      color:
                        guia.estado === "confirmado"
                          ? themeColors.estado.confirmado.text
                          : guia.estado === "anulado"
                            ? themeColors.estado.anulado.text
                            : themeColors.estado.borrador.text,
                    }}
                  >
                    {guia.estado === "confirmado" ? "Confirmado" : guia.estado === "anulado" ? "Anulado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(guia.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                      <Link href={`/guias/ver/${guia.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                      <Link href={`/guias/editar/${guia.id}`}>
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
