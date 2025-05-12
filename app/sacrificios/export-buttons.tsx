"use client"

import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileIcon as FilePdf, Loader2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function ExportButtons({ sacrificios, tipoAnimal }) {
  const { toast } = useToast()
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Función para formatear números sin decimales y con coma como separador de miles
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0"
    }
    return Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true)

      // Preparar los datos para Excel
      const data = sacrificios.map((sacrificio) => ({
        Guía: sacrificio.numero_documento,
        Fecha: new Date(sacrificio.fecha_documento).toLocaleDateString("es-CO"),
        "Propietario Anterior": sacrificio.dueno_anterior_nombre || "N/A",
        "NIT Anterior": sacrificio.dueno_anterior_nit || "N/A",
        "Propietario Nuevo": sacrificio.dueno_nuevo_nombre || "N/A",
        "NIT Nuevo": sacrificio.dueno_nuevo_nit || "N/A",
        Machos: Number(sacrificio.quantity_m) || 0,
        Hembras: Number(sacrificio.quantity_h) || 0,
        "Total Animales": (Number(sacrificio.quantity_m) || 0) + (Number(sacrificio.quantity_h) || 0),
        Kilos: Number(sacrificio.quantity_k) || 0,
        Degüello: Number(sacrificio.impuesto1) || 0,
        Fondo: Number(sacrificio.impuesto2) || 0,
        Matadero: Number(sacrificio.impuesto3) || 0,
        Refrigeración: Number(sacrificio.refrigeration) || 0,
        "Horas Extras": Number(sacrificio.extra_hour) || 0,
        Estado:
          sacrificio.estado === "confirmado" ? "Confirmado" : sacrificio.estado === "anulado" ? "Anulado" : "Borrador",
        Total: Number(sacrificio.total) || 0,
      }))

      // Calcular totales
      const totalMachos = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_m) || 0), 0)
      const totalHembras = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_h) || 0), 0)
      const totalAnimales = totalMachos + totalHembras
      const totalKilos = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_k) || 0), 0)
      const totalDeguello = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto1) || 0), 0)
      const totalFondo = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto2) || 0), 0)
      const totalMatadero = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto3) || 0), 0)
      const totalRefrigeracion = sacrificios.reduce((sum, s) => sum + (Number(s.refrigeration) || 0), 0)
      const totalHorasExtras = sacrificios.reduce((sum, s) => sum + (Number(s.extra_hour) || 0), 0)
      const totalValor = sacrificios.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

      // Añadir fila de totales
      data.push({
        Guía: "",
        Fecha: "",
        "Propietario Anterior": "",
        "NIT Anterior": "",
        "Propietario Nuevo": "",
        "NIT Nuevo": "TOTAL",
        Machos: totalMachos,
        Hembras: totalHembras,
        "Total Animales": totalAnimales,
        Kilos: totalKilos,
        Degüello: totalDeguello,
        Fondo: totalFondo,
        Matadero: totalMatadero,
        Refrigeración: totalRefrigeracion,
        "Horas Extras": totalHorasExtras,
        Estado: "",
        Total: totalValor,
      })

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        `Sacrificios ${tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"}`,
      )

      // Ajustar anchos de columna
      const colWidths = [
        { wch: 10 }, // Guía
        { wch: 12 }, // Fecha
        { wch: 25 }, // Propietario Anterior
        { wch: 15 }, // NIT Anterior
        { wch: 25 }, // Propietario Nuevo
        { wch: 15 }, // NIT Nuevo
        { wch: 10 }, // Machos
        { wch: 10 }, // Hembras
        { wch: 15 }, // Total Animales
        { wch: 10 }, // Kilos
        { wch: 12 }, // Degüello
        { wch: 12 }, // Fondo
        { wch: 12 }, // Matadero
        { wch: 15 }, // Refrigeración
        { wch: 15 }, // Horas Extras
        { wch: 12 }, // Estado
        { wch: 15 }, // Total
      ]
      worksheet["!cols"] = colWidths

      // Corregido: Usar métodos compatibles con el navegador para descargar el archivo
      // Generar un blob con los datos del Excel
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = `sacrificios_${tipoAnimal || "todos"}_${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Exportación exitosa",
        description: "El archivo Excel ha sido generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      })
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true)

      // Crear documento PDF con orientación horizontal (landscape)
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Colores corporativos
      const primaryColor = [39, 105, 65] // Verde oscuro
      const secondaryColor = [70, 136, 71] // Verde medio

      // Título principal con color
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F")

      // Nombre de la organización
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255) // Texto blanco
      doc.setFontSize(18)
      doc.text("SOCIEDAD AGRICULTORA Y GANADERA DEL CAUCA SAG", doc.internal.pageSize.getWidth() / 2, 15, {
        align: "center",
      })

      // Subtítulo del reporte
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
      doc.rect(0, 30, doc.internal.pageSize.getWidth(), 12, "F")

      doc.setFontSize(12)
      doc.text(
        `REPORTE DE SACRIFICIOS ${tipoAnimal === "bovino" ? "BOVINOS" : "PORCINOS"}`,
        doc.internal.pageSize.getWidth() / 2,
        38,
        { align: "center" },
      )

      // Fecha de generación
      doc.setTextColor(0, 0, 0) // Texto negro
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Generado el: ${new Date().toLocaleDateString("es-CO")}`, doc.internal.pageSize.getWidth() - 20, 50, {
        align: "right",
      })

      // Preparar datos para la tabla
      const tableData = sacrificios.map((sacrificio) => [
        sacrificio.numero_documento || "",
        new Date(sacrificio.fecha_documento).toLocaleDateString("es-CO"),
        sacrificio.dueno_anterior_nombre || "N/A",
        sacrificio.dueno_anterior_nit || "N/A",
        sacrificio.dueno_nuevo_nombre || "N/A",
        sacrificio.dueno_nuevo_nit || "N/A",
        formatNumber(sacrificio.quantity_m || 0),
        formatNumber(sacrificio.quantity_h || 0),
        formatNumber((Number(sacrificio.quantity_m) || 0) + (Number(sacrificio.quantity_h) || 0)),
        formatNumber(sacrificio.quantity_k || 0),
        formatNumber(sacrificio.impuesto1 || 0),
        formatNumber(sacrificio.impuesto2 || 0),
        formatNumber(sacrificio.impuesto3 || 0),
        formatNumber(sacrificio.refrigeration || 0),
        formatNumber(sacrificio.extra_hour || 0),
        sacrificio.estado === "confirmado" ? "Confirmado" : sacrificio.estado === "anulado" ? "Anulado" : "Borrador",
        formatNumber(sacrificio.total || 0),
      ])

      // Calcular totales
      const totalMachos = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_m) || 0), 0)
      const totalHembras = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_h) || 0), 0)
      const totalAnimales = totalMachos + totalHembras
      const totalKilos = sacrificios.reduce((sum, s) => sum + (Number(s.quantity_k) || 0), 0)
      const totalDeguello = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto1) || 0), 0)
      const totalFondo = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto2) || 0), 0)
      const totalMatadero = sacrificios.reduce((sum, s) => sum + (Number(s.impuesto3) || 0), 0)
      const totalRefrigeracion = sacrificios.reduce((sum, s) => sum + (Number(s.refrigeration) || 0), 0)
      const totalHorasExtras = sacrificios.reduce((sum, s) => sum + (Number(s.extra_hour) || 0), 0)
      const totalValor = sacrificios.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

      // Añadir fila de totales
      tableData.push([
        "",
        "",
        "",
        "",
        "",
        "TOTAL",
        formatNumber(totalMachos),
        formatNumber(totalHembras),
        formatNumber(totalAnimales),
        formatNumber(totalKilos),
        formatNumber(totalDeguello),
        formatNumber(totalFondo),
        formatNumber(totalMatadero),
        formatNumber(totalRefrigeracion),
        formatNumber(totalHorasExtras),
        "",
        formatNumber(totalValor),
      ])

      // Generar tabla con autoTable
      autoTable(doc, {
        head: [
          [
            "Guía",
            "Fecha",
            "Prop. Anterior",
            "NIT Anterior",
            "Prop. Nuevo",
            "NIT Nuevo",
            "Machos",
            "Hembras",
            "T. Anim.",
            "Kilos",
            "Degüello",
            "Fondo",
            "Matadero",
            "Refrig.",
            "H. Extras",
            "Estado",
            "Total",
          ],
        ],
        body: tableData,
        startY: 55,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 2,
          lineColor: [200, 200, 200],
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        footStyles: {
          fillColor: secondaryColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        margin: { top: 55 },
        didDrawPage: (data) => {
          // Encabezado en cada página
          // Barra superior verde
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, "F")

          // Título en cada página
          doc.setFont("helvetica", "bold")
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(14)
          doc.text("SOCIEDAD AGRICULTORA Y GANADERA DEL CAUCA SAG", doc.internal.pageSize.getWidth() / 2, 10, {
            align: "center",
          })

          // Subtítulo con número de página
          doc.setFontSize(10)
          doc.text(
            `Reporte de Sacrificios ${tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"} - Página ${doc.internal.getNumberOfPages()}`,
            doc.internal.pageSize.getWidth() / 2,
            18,
            { align: "center" },
          )
        },
      })

      // Guardar PDF
      doc.save(`sacrificios_${tipoAnimal || "todos"}_${new Date().toISOString().split("T")[0]}.pdf`)

      toast({
        title: "Exportación exitosa",
        description: "El archivo PDF ha sido generado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el archivo PDF",
        variant: "destructive",
      })
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isExportingExcel || isExportingPdf}
        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
      >
        {isExportingExcel ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        {isExportingExcel ? "Exportando..." : "Exportar a Excel"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={isExportingExcel || isExportingPdf}
        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
      >
        {isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePdf className="mr-2 h-4 w-4" />}
        {isExportingPdf ? "Exportando..." : "Exportar a PDF"}
      </Button>
    </div>
  )
}
