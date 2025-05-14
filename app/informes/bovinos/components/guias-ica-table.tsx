"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileDown, Printer, Eye, Edit, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Función directa para formatear fechas sin conversiones de zona horaria
function formatRawDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""

  // Si es formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const datePart = dateStr.split("T")[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-")
      return `${day}/${month}/${year}`
    }
  }

  // Si ya está en formato DD/MM/YYYY
  if (typeof dateStr === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr
  }

  // Para otros formatos, intentar convertir
  try {
    const date = new Date(dateStr)
    const day = String(date.getUTCDate()).padStart(2, "0")
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const year = date.getUTCFullYear()
    return `${day}/${month}/${year}`
  } catch (e) {
    console.error("Error al formatear fecha:", dateStr, e)
    return String(dateStr)
  }
}

export default function GuiasIcaTable({ guias = [] }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar guías por término de búsqueda
  const filteredGuias = guias.filter(
    (guia) =>
      guia.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.dueno_anterior_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guia.dueno_anterior_nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatRawDate(guia.fecha_documento).includes(searchTerm.toLowerCase()),
  )

  // Depurar fechas
  console.log(
    "Fechas originales de guías ICA:",
    guias.map((g) => ({
      id: g.id,
      fecha_original: g.fecha_documento,
      fecha_formateada: formatRawDate(g.fecha_documento),
    })),
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar guía, propietario, NIT..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="absolute right-2 top-2.5" onClick={() => setSearchTerm("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuias.length > 0 ? (
              filteredGuias.map((guia) => (
                <TableRow key={guia.id}>
                  <TableCell className="font-medium">{guia.numero_documento}</TableCell>
                  <TableCell>{formatRawDate(guia.fecha_documento)}</TableCell>
                  <TableCell>{guia.dueno_anterior_nombre}</TableCell>
                  <TableCell>{guia.dueno_anterior_nit}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        guia.estado === "confirmado" ? "success" : guia.estado === "anulado" ? "destructive" : "default"
                      }
                    >
                      {guia.estado === "confirmado" ? "Confirmado" : guia.estado === "anulado" ? "Anulado" : "Borrador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron guías con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredGuias.length} de {guias.length} guías
      </div>
    </div>
  )
}
