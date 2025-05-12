"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function ExportTicketsButtons({ tipo, estado, fechaDesde, fechaHasta }) {
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const { toast } = useToast()

  const handleExportExcel = async () => {
    try {
      setLoadingExcel(true)

      // Construir la URL con los parámetros
      let url = `/api/export/tickets/excel?tipo=${tipo || ""}`

      if (estado && estado !== "all") {
        url += `&estado=${estado}`
      }

      if (fechaDesde) {
        url += `&fechaDesde=${fechaDesde}`
      }

      if (fechaHasta) {
        url += `&fechaHasta=${fechaHasta}`
      }

      // Realizar la solicitud
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar a Excel")
      }

      // Obtener el blob y crear un enlace de descarga
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `tickets_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast({
        title: "Exportación exitosa",
        description: "Los tickets se han exportado a Excel correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error al exportar",
        description: error.message || "No se pudo exportar los tickets a Excel",
        variant: "destructive",
      })
    } finally {
      setLoadingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setLoadingPdf(true)

      // Construir la URL con los parámetros
      let url = `/api/export/tickets/pdf?tipo=${tipo || ""}`

      if (estado && estado !== "all") {
        url += `&estado=${estado}`
      }

      if (fechaDesde) {
        url += `&fechaDesde=${fechaDesde}`
      }

      if (fechaHasta) {
        url += `&fechaHasta=${fechaHasta}`
      }

      // Realizar la solicitud
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar a PDF")
      }

      // Obtener el blob y crear un enlace de descarga
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `tickets_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast({
        title: "Exportación exitosa",
        description: "Los tickets se han exportado a PDF correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error al exportar",
        description: error.message || "No se pudo exportar los tickets a PDF",
        variant: "destructive",
      })
    } finally {
      setLoadingPdf(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={loadingExcel}
        className="flex items-center gap-1"
      >
        <FileSpreadsheet className="h-4 w-4 text-green-600" />
        <span>{loadingExcel ? "Exportando..." : "Excel"}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={loadingPdf}
        className="flex items-center gap-1"
      >
        <FileText className="h-4 w-4 text-red-600" />
        <span>{loadingPdf ? "Exportando..." : "PDF"}</span>
      </Button>
    </div>
  )
}
