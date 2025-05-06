"use client"

import { useState } from "react"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { exportarBoletinGanadoMayor } from "../actions"
import { useToast } from "@/components/ui/use-toast"
import { BoletinGanadoMayor } from "@/components/informes/boletin-ganado-mayor"

export default function BoletinGanadoMayorPage() {
  const { toast } = useToast()
  const [fechaInicio, setFechaInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
  )
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split("T")[0])

  const handleDateRangeChange = (start: Date, end: Date) => {
    setFechaInicio(start.toISOString().split("T")[0])
    setFechaFin(end.toISOString().split("T")[0])
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      const result = await exportarBoletinGanadoMayor(fechaInicio, fechaFin)
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">BOLETÍN MOVIMIENTO DE GANADO MAYOR BOVINOS</h1>
          <p className="text-muted-foreground">Registro de sacrificios de ganado bovino y distribución de impuestos</p>
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <DatePickerWithRange onRangeChange={handleDateRangeChange} />
      </div>

      <BoletinGanadoMayor fechaInicio={fechaInicio} fechaFin={fechaFin} />
    </div>
  )
}
