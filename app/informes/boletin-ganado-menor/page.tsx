"use client"

import { useState } from "react"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet, FileText } from "lucide-react"
import { exportarBoletinGanadoMenor } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { BoletinGanadoMenor } from "@/components/informes/boletin-ganado-menor"
import React from "react"

export default function BoletinGanadoMenorPage() {
  const { toast } = useToast()
  const [fechaInicio, setFechaInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
  )
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split("T")[0])
  const boletinRef = React.useRef<any>(null)

  const handleDateRangeChange = (start: Date, end: Date) => {
    setFechaInicio(start.toISOString().split("T")[0])
    setFechaFin(end.toISOString().split("T")[0])
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      const result = await exportarBoletinGanadoMenor(fechaInicio, fechaFin)
      if (result.success) {
        toast({
          title: "Exportación exitosa",
          description: "El boletín se ha exportado correctamente a Excel.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al exportar el boletín.",
        variant: "destructive",
      })
    }
  }

  const handleExportPdf = () => {
    if (boletinRef.current) {
      boletinRef.current.exportToPdf()
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BOLETÍN MOVIMIENTO DE GANADO MENOR PORCINOS</h1>
          <p className="text-muted-foreground">Registro de sacrificios de ganado porcino y distribución de impuestos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar a Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar a PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <DatePickerWithRange onRangeChange={handleDateRangeChange} />
      </div>

      <BoletinGanadoMenor fechaInicio={fechaInicio} fechaFin={fechaFin} ref={boletinRef} />
    </div>
  )
}
