"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function ExportButtons({ tipo }) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/export/sacrificios/excel${tipo ? `?tipo=${tipo}` : ""}`)

      if (!response.ok) {
        throw new Error("Error al exportar a Excel")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sacrificios_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel ha sido generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
      <FileDown className="mr-2 h-4 w-4" />
      {isExporting ? "Exportando..." : "Exportar a Excel"}
    </Button>
  )
}
