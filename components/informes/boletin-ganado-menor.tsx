"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { type BoletinGanadoItem, getBoletinGanadoMenor } from "@/app/informes/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, FileText, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

// Función para formatear números como moneda sin símbolo y sin decimales
function formatNumber(value: number): string {
  if (isNaN(value)) return "0"
  return value
    .toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\./g, ",")
}

export function BoletinGanadoMenor({
  fechaInicio,
  fechaFin,
}: {
  fechaInicio: string
  fechaFin: string
}) {
  const [datos, setDatos] = useState<BoletinGanadoItem[]>([])
  const [datosFiltrados, setDatosFiltrados] = useState<BoletinGanadoItem[]>([])
  const [totales, setTotales] = useState({
    cantidadTotal: 0,
    cantidadMachos: 0,
    cantidadHembras: 0,
    cantidadKilos: 0,
    valorDeguello: 0,
    servicioMatadero: 0,
    fondoPorcicultura: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  // Cargar datos reales
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true)
      try {
        const datosInforme = await getBoletinGanadoMenor(fechaInicio, fechaFin)
        setDatos(datosInforme)
        setDatosFiltrados(datosInforme)
        calcularTotales(datosInforme)
      } catch (error) {
        console.error("Error al cargar datos del boletín:", error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [fechaInicio, fechaFin])

  // Filtrar datos cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === "") {
      setDatosFiltrados(datos)
    } else {
      const termino = busqueda.toLowerCase()
      const filtrados = datos.filter(
        (item) =>
          (item.fecha && new Date(item.fecha).toLocaleDateString("es-CO").toLowerCase().includes(termino)) ||
          (item.numeroGuiaIca && item.numeroGuiaIca.toString().toLowerCase().includes(termino)),
      )
      setDatosFiltrados(filtrados)
    }

    // Recalcular totales con los datos filtrados
    if (datosFiltrados.length > 0) {
      calcularTotales(datosFiltrados)
    }
  }, [busqueda, datos])

  // Calcular totales
  const calcularTotales = (items: BoletinGanadoItem[]) => {
    const nuevosTotales = items.reduce(
      (acc, item) => {
        return {
          cantidadTotal: acc.cantidadTotal + item.cantidadTotal,
          cantidadMachos: acc.cantidadMachos + item.cantidadMachos,
          cantidadHembras: acc.cantidadHembras + item.cantidadHembras,
          cantidadKilos: acc.cantidadKilos + item.cantidadKilos,
          valorDeguello: acc.valorDeguello + item.valorDeguello,
          servicioMatadero: acc.servicioMatadero + item.servicioMatadero,
          fondoPorcicultura: acc.fondoPorcicultura + item.fondoFedegan, // Usamos el mismo campo pero con nombre diferente
          total: acc.total + item.total,
        }
      },
      {
        cantidadTotal: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        cantidadKilos: 0,
        valorDeguello: 0,
        servicioMatadero: 0,
        fondoPorcicultura: 0,
        total: 0,
      },
    )

    setTotales(nuevosTotales)
  }

  // Limpiar búsqueda
  const limpiarBusqueda = () => {
    setBusqueda("")
  }

  // Exportar a Excel
  const exportToExcel = async () => {
    try {
      setExporting(true)

      // Preparar datos para Excel
      const excelData = datosFiltrados.map((item) => ({
        Fecha: new Date(item.fecha).toLocaleDateString("es-CO"),
        "G/Deguello": item.numeroGuiaIca,
        "Cantidad Total": item.cantidadTotal,
        Machos: item.cantidadMachos,
        Hembras: item.cantidadHembras,
        Kilos: item.cantidadKilos,
        "Valor Deguello": item.valorDeguello,
        "Servicio Matadero": item.servicioMatadero,
        "Fondo Porcicultura": item.fondoFedegan,
        Total: item.total,
        "Boletín Nº": item.numeroBoletin,
      }))

      // Agregar fila de totales
      excelData.push({
        Fecha: "TOTALES",
        "G/Deguello": "",
        "Cantidad Total": totales.cantidadTotal,
        Machos: totales.cantidadMachos,
        Hembras: totales.cantidadHembras,
        Kilos: totales.cantidadKilos,
        "Valor Deguello": totales.valorDeguello,
        "Servicio Matadero": totales.servicioMatadero,
        "Fondo Porcicultura": totales.fondoPorcicultura,
        Total: totales.total,
        "Boletín Nº": "",
      })

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Boletín Ganado Menor")

      // Generar archivo Excel en memoria
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear URL para descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `boletin-ganado-menor-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(link)
      link.click()

      // Limpiar recursos
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "El boletín se ha exportado correctamente a Excel.",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error",
        description: `Error al exportar a Excel: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  // Exportar a PDF
  const exportToPdf = async () => {
    try {
      setExporting(true)

      // Crear documento PDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Agregar título
      doc.setFontSize(16)
      doc.text("CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      })
      doc.text("BOLETIN GANADO MENOR", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" })

      // Agregar período
      doc.setFontSize(12)
      doc.text(
        `Período: ${new Date(fechaInicio).toLocaleDateString("es-CO")} - ${new Date(fechaFin).toLocaleDateString("es-CO")}`,
        doc.internal.pageSize.getWidth() / 2,
        30,
        { align: "center" },
      )

      // Preparar datos para la tabla
      const tableData = datosFiltrados.map((item) => [
        new Date(item.fecha).toLocaleDateString("es-CO"),
        item.numeroGuiaIca,
        item.cantidadTotal,
        item.cantidadMachos,
        item.cantidadHembras,
        formatNumber(item.cantidadKilos),
        formatNumber(item.valorDeguello),
        formatNumber(item.servicioMatadero),
        formatNumber(item.fondoFedegan),
        formatNumber(item.total),
        item.numeroBoletin,
      ])

      // Agregar fila de totales
      tableData.push([
        "TOTALES",
        "",
        totales.cantidadTotal,
        totales.cantidadMachos,
        totales.cantidadHembras,
        formatNumber(totales.cantidadKilos),
        formatNumber(totales.valorDeguello),
        formatNumber(totales.servicioMatadero),
        formatNumber(totales.fondoPorcicultura),
        formatNumber(totales.total),
        "",
      ])

      // Crear tabla
      autoTable(doc, {
        head: [
          [
            "Fecha",
            "G/Deguello",
            "Cantidad Total",
            "Machos",
            "Hembras",
            "Kilos",
            "Valor Deguello",
            "Servicio Matadero",
            "Fondo Porcicultura",
            "Total",
            "Boletín Nº",
          ],
        ],
        body: tableData,
        startY: 35,
        theme: "grid",
        headStyles: { fillColor: [75, 75, 75], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      })

      // Agregar sección de distribución del impuesto
      const finalY = (doc as any).lastAutoTable.finalY || 150
      doc.setFontSize(14)
      doc.text("Distribución del Impuesto de Deguello", 14, finalY + 15)

      doc.setFontSize(12)
      doc.text(`Valor Total Impuesto Deguello: ${formatNumber(totales.valorDeguello)}`, 14, finalY + 25)
      doc.text(`Alcaldía (50%): ${formatNumber(totales.valorDeguello / 2)}`, 14, finalY + 35)
      doc.text(`Gobernación (50%): ${formatNumber(totales.valorDeguello / 2)}`, 14, finalY + 45)

      // Guardar PDF
      const fileName = `boletin-ganado-menor-${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)

      toast({
        title: "Exportación exitosa",
        description: "El boletín se ha exportado correctamente a PDF.",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error",
        description: `Error al exportar a PDF: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtro de búsqueda */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por fecha o número de documento..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={limpiarBusqueda}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            disabled={loading || datosFiltrados.length === 0 || exporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={exportToPdf}
            disabled={loading || datosFiltrados.length === 0 || exporting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {datosFiltrados.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-lg text-muted-foreground">No hay datos disponibles para el período seleccionado.</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="border">Fecha</TableHead>
                <TableHead className="border">G/Deguello</TableHead>
                <TableHead className="text-center border">Cantidad Total</TableHead>
                <TableHead className="text-center border">Machos</TableHead>
                <TableHead className="text-center border">Hembras</TableHead>
                <TableHead className="text-center border">Kilos</TableHead>
                <TableHead className="text-right border">Valor Deguello</TableHead>
                <TableHead className="text-right border">Servicio Matadero</TableHead>
                <TableHead className="text-right border">Fondo Porcicultura</TableHead>
                <TableHead className="text-right border">Total</TableHead>
                <TableHead className="text-center border">Boletín Nº</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosFiltrados.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="border">{new Date(item.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell className="border">{item.numeroGuiaIca}</TableCell>
                  <TableCell className="text-center border">{item.cantidadTotal}</TableCell>
                  <TableCell className="text-center border">{item.cantidadMachos}</TableCell>
                  <TableCell className="text-center border">{item.cantidadHembras}</TableCell>
                  <TableCell className="text-center border">{formatNumber(item.cantidadKilos)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.valorDeguello)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.servicioMatadero)}</TableCell>
                  <TableCell className="text-right border">{formatNumber(item.fondoFedegan)}</TableCell>
                  <TableCell className="text-right border font-bold">{formatNumber(item.total)}</TableCell>
                  <TableCell className="text-center border">{item.numeroBoletin}</TableCell>
                </TableRow>
              ))}

              {/* Fila de totales */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="border font-bold">
                  TOTALES
                </TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadTotal}</TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadMachos}</TableCell>
                <TableCell className="text-center border font-bold">{totales.cantidadHembras}</TableCell>
                <TableCell className="text-center border font-bold">{formatNumber(totales.cantidadKilos)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.valorDeguello)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.servicioMatadero)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.fondoPorcicultura)}</TableCell>
                <TableCell className="text-right border font-bold">{formatNumber(totales.total)}</TableCell>
                <TableCell className="border"></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Sección de distribución del impuesto de deguello */}
          <div className="mt-8 p-4 border rounded-lg">
            <h3 className="text-lg font-bold mb-4">Distribución del Impuesto de Deguello</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Valor Total Impuesto Deguello</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Alcaldía (50%)</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello / 2)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Gobernación (50%)</p>
                <p className="text-xl font-bold">{formatNumber(totales.valorDeguello / 2)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
