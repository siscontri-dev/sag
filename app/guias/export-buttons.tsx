"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileIcon as FilePdf, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function ExportButtons({ tipo, estado }: { tipo?: string; estado?: string }) {
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const { toast } = useToast()

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true)
      toast({
        title: "Exportando",
        description: "Generando archivo Excel...",
      })

      // Construir la URL con los parámetros
      let url = `/api/export/guias/excel?`
      if (tipo) url += `tipo=${tipo}&`
      if (estado) url += `estado=${estado}&`

      // Iniciar la descarga usando fetch para manejar errores
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar a Excel")
      }

      // Crear un blob y descargarlo
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `guias_ica_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Archivo Excel generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al exportar a Excel",
        variant: "destructive",
      })
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true)
      toast({
        title: "Exportando",
        description: "Generando archivo PDF...",
      })

      // Construir la URL con los parámetros
      let url = `/api/export/guias/pdf?`
      if (tipo) url += `tipo=${tipo}&`
      if (estado) url += `estado=${estado}&`

      // Iniciar la descarga usando fetch para manejar errores
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al exportar a PDF")
      }

      // Crear un blob y descargarlo
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `guias_ica_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Archivo PDF generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al exportar a PDF",
        variant: "destructive",
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="flex justify-end gap-2 mb-2">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={handleExportExcel}
        disabled={isExportingExcel || isExportingPDF}
      >
        {isExportingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
        )}
        <span>Exportar a Excel</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={handleExportPDF}
        disabled={isExportingExcel || isExportingPDF}
      >
        {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePdf className="h-4 w-4 text-red-600" />}
        <span>Exportar a PDF</span>
      </Button>
    </div>
  )
}
