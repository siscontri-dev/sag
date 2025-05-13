"use client"

import { formatCurrency } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export default function GuiasTable({ guias }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Propietario Anterior</TableHead>
            <TableHead>NIT Anterior</TableHead>
            <TableHead>Propietario Nuevo</TableHead>
            <TableHead>NIT Nuevo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guias.map((guia) => (
            <TableRow key={guia.id}>
              <TableCell>{guia.numero_documento}</TableCell>
              <TableCell>{String(guia.fecha_documento)}</TableCell>
              <TableCell>{guia.dueno_anterior_nombre || "N/A"}</TableCell>
              <TableCell>{guia.dueno_anterior_nit || "N/A"}</TableCell>
              <TableCell>{guia.dueno_nuevo_nombre || "N/A"}</TableCell>
              <TableCell>{guia.dueno_nuevo_nit || "N/A"}</TableCell>
              <TableCell>{formatCurrency(guia.total)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/guias/ver/${guia.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
