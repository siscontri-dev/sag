import { type NextRequest, NextResponse } from "next/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Interfaces para los datos
interface BoletinItem {
  Fecha: string
  "G/ Deguello": string
  Cantidad: string
  "Cantidad Machos": string
  "Cantidad Hembras": string
  "Vr Deguello": string
  "Ser. Matadero": string
  Porcicultura: string
  Total: string
}

interface ExportData {
  title: string
  data: BoletinItem[]
  boletinNumber: string
  filters?: {
    dateRange: string | null
    searchTerm: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json()

    // Calcular totales
    const totales = data.data.reduce(
      (acc, item) => {
        acc.cantidad += Number.parseInt(item.Cantidad?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadMachos += Number.parseInt(item["Cantidad Machos"]?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadHembras += Number.parseInt(item["Cantidad Hembras"]?.replace(/,/g, "") || "0", 10) || 0
        acc.vrDeguello += Number.parseInt(item["Vr Deguello"]?.replace(/,/g, "") || "0", 10) || 0
        acc.serMatadero += Number.parseInt(item["Ser. Matadero"]?.replace(/,/g, "") || "0", 10) || 0
        acc.porcicultura += Number.parseInt(item.Porcicultura?.replace(/,/g, "") || "0", 10) || 0
        acc.total += Number.parseInt(item.Total?.replace(/,/g, "") || "0", 10) || 0
        return acc
      },
      {
        cantidad: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        vrDeguello: 0,
        serMatadero: 0,
        porcicultura: 0,
        total: 0,
      },
    )

    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Configurar metadatos del documento
    doc.setProperties({
      title: "Boletín Movimiento de Porcinos",
      subject: `Boletín No. ${data.boletinNumber}`,
      author: "Sistema de Gestión",
      creator: "Sistema de Gestión",
    })

    // Título
    const titleLines = data.title.split("\n")
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text(titleLines[0], doc.internal.pageSize.getWidth() / 2, 20, { align: "center" })
    doc.text(titleLines[1], doc.internal.pageSize.getWidth() / 2, 28, { align: "center" })

    // Número de boletín
    doc.setFontSize(12)
    doc.text(`Boletín No. ${data.boletinNumber}`, doc.internal.pageSize.getWidth() / 2, 36, { align: "center" })

    // Información de filtros
    let yPos = 45
    if (data.filters) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")

      if (data.filters.dateRange) {
        doc.text(`Rango de fechas: ${data.filters.dateRange}`, 14, yPos)
        yPos += 6
      }

      if (data.filters.searchTerm) {
        doc.text(`Término de búsqueda: ${data.filters.searchTerm}`, 14, yPos)
        yPos += 6
      }
    }

    // Preparar datos para la tabla
    const tableData = data.data.map((item) => [
      item.Fecha,
      item["G/ Deguello"],
      item.Cantidad,
      item["Cantidad Machos"],
      item["Cantidad Hembras"],
      item["Vr Deguello"],
      item["Ser. Matadero"],
      item.Porcicultura,
      item.Total,
    ])

    // Añadir fila de totales
    tableData.push([
      "TOTALES",
      "",
      totales.cantidad.toLocaleString(),
      totales.cantidadMachos.toLocaleString(),
      totales.cantidadHembras.toLocaleString(),
      totales.vrDeguello.toLocaleString(),
      totales.serMatadero.toLocaleString(),
      totales.porcicultura.toLocaleString(),
      totales.total.toLocaleString(),
    ])

    // Generar la tabla
    autoTable(doc, {
      startY: yPos,
      head: [
        [
          "Fecha",
          "G/ Deguello",
          "Cantidad",
          "Cant. Machos",
          "Cant. Hembras",
          "Vr. Deguello",
          "Ser. Matadero",
          "Porcicultura",
          "Total",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [80, 80, 80],
      },
      columnStyles: {
        0: { halign: "left" }, // Fecha
        1: { halign: "left" }, // G/ Deguello
        2: { halign: "right" }, // Cantidad
        3: { halign: "right" }, // Cant. Machos
        4: { halign: "right" }, // Cant. Hembras
        5: { halign: "right" }, // Vr. Deguello
        6: { halign: "right" }, // Ser. Matadero
        7: { halign: "right" }, // Porcicultura
        8: { halign: "right" }, // Total
      },
      didParseCell: (data) => {
        // Aplicar estilo a la fila de totales
        const lastRowIndex = tableData.length - 1
        if (data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.fillColor = [240, 240, 240]
        }
      },
      didDrawPage: (data) => {
        // Añadir número de página
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10,
        )
      },
    })

    // Convertir el PDF a un ArrayBuffer
    const pdfBuffer = doc.output("arraybuffer")

    // Devolver el PDF como respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="boletin_movimiento_porcinos_${data.boletinNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    return NextResponse.json({ error: "Error al exportar a PDF" }, { status: 500 })
  }
}
