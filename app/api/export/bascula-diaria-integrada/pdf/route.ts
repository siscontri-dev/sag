import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Definir tipos para TypeScript
interface BasculaItem {
  fecha: string
  tiquetes: string
  cantidad: string
  valor_unitario: string
  total: string
}

interface ExportData {
  title: string
  headers: string[]
  rows: string[][]
  totals: string[]
  bovinos?: BasculaItem[]
  porcinos?: BasculaItem[]
  filters?: {
    dateRange: string | null
    searchTerm: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json()

    // Crear un nuevo documento PDF con jsPDF (compatible con entornos serverless)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Configurar metadatos del documento
    doc.setProperties({
      title: "Báscula Diaria Integrada",
      author: "Sistema de Gestión",
      subject: "Reporte de Báscula Diaria Integrada",
      keywords: "bascula, diaria, integrada, bovinos, porcinos",
    })

    // Configurar fuentes y estilos
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)

    // Título
    doc.text("CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA", doc.internal.pageSize.getWidth() / 2, 20, {
      align: "center",
    })
    doc.text(data.title, doc.internal.pageSize.getWidth() / 2, 30, { align: "center" })

    // Información de filtros
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Fecha de generación: ${new Date().toLocaleDateString("es-CO")}`,
      doc.internal.pageSize.getWidth() - 20,
      40,
      { align: "right" },
    )

    if (data.filters) {
      doc.text(`Filtros aplicados:`, 20, 45)
      doc.text(`• Rango de fechas: ${data.filters.dateRange || "Todos"}`, 25, 50)
      doc.text(`• Término de búsqueda: ${data.filters.searchTerm || "Ninguno"}`, 25, 55)
    }

    // Preparar datos para la tabla
    const tableHeaders = data.headers
    const tableRows = data.rows.map((row) => [...row])
    const tableTotals = [data.totals]

    // Crear tabla con autoTable como función independiente
    autoTable(doc, {
      startY: 65,
      head: [tableHeaders],
      body: tableRows,
      foot: tableTotals,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      footStyles: {
        fillColor: [189, 195, 199],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "left" }, // Fecha alineada a la izquierda
        1: { halign: "right" }, // Resto de columnas alineadas a la derecha
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
      },
      didDrawPage: (data) => {
        // Agregar número de página
        doc.setFontSize(8)
        doc.text(
          `Página ${doc.getCurrentPageInfo().pageNumber} de ${doc.getNumberOfPages()}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: "right" },
        )
      },
    })

    // Convertir el PDF a un array buffer
    const pdfOutput = doc.output("arraybuffer")

    // Devolver el PDF como respuesta
    return new NextResponse(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bascula-diaria-integrada-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar el PDF" }, { status: 500 })
  }
}
