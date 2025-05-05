"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function GuiasTable({ guias = [] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Dueño Anterior</TableHead>
            <TableHead>Dueño Nuevo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron guías.
              </TableCell>
            </TableRow>
          ) : (
            guias.map((guia) => (
              <TableRow key={guia.id}>
                <TableCell className="font-medium">{guia.numero_documento}</TableCell>
                <TableCell>{formatDate(guia.fecha_documento)}</TableCell>
                <TableCell>{guia.dueno_anterior_nombre || "N/A"}</TableCell>
                <TableCell>{guia.dueno_nuevo_nombre || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      guia.estado === "confirmado" ? "default" : guia.estado === "anulado" ? "destructive" : "outline"
                    }
                  >
                    {guia.estado === "confirmado" ? "Confirmado" : guia.estado === "anulado" ? "Anulado" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(guia.total)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/guias/ver/${guia.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
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
