"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InformeDiarioBasculaCorralaje } from "@/components/informes/informe-diario-bascula-corralaje"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, FileSpreadsheet } from "lucide-react"
import { exportarInformeBasculaCorralaje } from "../actions"
import { useToast } from "@/components/ui/use-toast"

export default function InformeBasculaCorralajePage() {
  const { toast } = useToast()
  const [fechaInicio, setFechaInicio] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
  )
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split("T")[0])
  const [tipo, setTipo] = useState<"bovino" | "porcino">("bovino")

  const handleDateRangeChange = (start: Date, end: Date) => {
    setFechaInicio(start.toISOString().split("T")[0])
    setFechaFin(end.toISOString().split("T")[0])
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      const result = await exportarInformeBasculaCorralaje(tipo, fechaInicio, fechaFin)
      if (result.success) {
        toast({
          title: "Exportación exitosa",
          description: "El informe se ha exportado correctamente a Excel.",
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
        description: "Ocurrió un error al exportar el informe.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Informe Diario Báscula y Corralaje</h1>
          <p className="text-muted-foreground">Visualiza el uso diario de básculas y corrales por tipo de animal</p>
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
        <DateRangePicker onRangeChange={handleDateRangeChange} />
      </div>

      <Tabs defaultValue="bovino" onValueChange={(value) => setTipo(value as "bovino" | "porcino")}>
        <TabsList>
          <TabsTrigger value="bovino">Bovinos</TabsTrigger>
          <TabsTrigger value="porcino">Porcinos</TabsTrigger>
        </TabsList>
        <TabsContent value="bovino" className="mt-4">
          <InformeDiarioBasculaCorralaje tipo="bovino" fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>
        <TabsContent value="porcino" className="mt-4">
          <InformeDiarioBasculaCorralaje tipo="porcino" fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
