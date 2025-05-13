"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ExportTicketsAgrupadosButtons({
  tipo,
  agrupacion = "dia",
  fechaDesde,
  fechaHasta,
}: {
  tipo?: string
  agrupacion?: string
  fechaDesde?: string
  fechaHasta?: string
}) {
  const { toast } = useToast()
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)

  const exportarExcel = async () => {
    try {
      setLoadingExcel(true)

      // Construir URL con parámetros
      let url = `/api/export/tickets-agrupados/excel?agrupacion=${agrupacion}`

      if (tipo) {
        url += `&tipo=${tipo}`
      }

      if (fechaDesde) {
        url += `&fechaDesde=${fechaDesde}`
      }

      if (fechaHasta) {
        url += `&fechaHasta=${fechaHasta}`
      }

      console.log("URL de exportación Excel:", url)

      // Abrir en nueva pestaña
      window.open(url, "_blank")

      toast({
        title: "Exportación iniciada",
        description: "La exportación a Excel se ha iniciado correctamente.",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar a Excel. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingExcel(false)
    }
  }

  const exportarPdf = async () => {
    try {
      setLoadingPdf(true)

      // Construir URL con parámetros
      let url = `/api/export/tickets-agrupados/pdf?agrupacion=${agrupacion}`

      if (tipo) {
        url += `&tipo=${tipo}`
      }

      if (fechaDesde) {
        url += `&fechaDesde=${fechaDesde}`
      }

      if (fechaHasta) {
        url += `&fechaHasta=${fechaHasta}`
      }

      console.log("URL de exportación PDF:", url)

      // Abrir en nueva pestaña
      window.open(url, "_blank")

      toast({
        title: "Exportación iniciada",
        description: "La exportación a PDF se ha iniciado correctamente.",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error al exportar",
        description: "No se pudo exportar a PDF. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={exportarExcel} disabled={loadingExcel} className="bg-green-600 hover:bg-green-700">
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        {loadingExcel ? "Exportando..." : "Excel"}
      </Button>
      <Button onClick={exportarPdf} disabled={loadingPdf} className="bg-red-600 hover:bg-red-700">
        <FileIcon className="mr-2 h-4 w-4" />
        {loadingPdf ? "Exportando..." : "PDF"}
      </Button>
    </div>
  )
}
