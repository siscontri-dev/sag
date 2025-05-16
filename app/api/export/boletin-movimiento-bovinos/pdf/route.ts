import { NextResponse } from "next/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export async function POST(request: Request) {
  try {
    const { title, boletinNumber, headers, rows, filterInfo } = await request.json()

    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Configurar metadatos del documento
    doc.setProperties({
      title: title,
      subject: "Boletín Movimiento de Bovinos",
      author: "Sistema de Gestión",
      keywords: "bovinos, deguello, informe",
      creator: "Sistema de Gestión",
    })

    // Agregar título
    doc.setFontSize(16)
    doc.text("CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" })

    doc.setFontSize(14)
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 22, { align: "center" })

    doc.setFontSize(12)
    doc.text(`Boletín No. ${boletinNumber}`, doc.internal.pageSize.getWidth() / 2, 28, { align: "center" })

    // Agregar información de filtros
    doc.setFontSize(10)
    doc.text(`Filtros aplicados:`, 14, 35)
    doc.text(`Rango de fechas: ${filterInfo.dateRange}`, 14, 40)
    doc.text(`Término de búsqueda: ${filterInfo.searchTerm}`, 14, 45)

    // Generar la tabla
    autoTable(doc, {
      startY: 50,
      head: [headers],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { halign: "left" }, // Fecha
        1: { halign: "left" }, // G/ Deguello
        2: { halign: "right" }, // Cantidad
        3: { halign: "right" }, // Cantidad Machos
        4: { halign: "right" }, // Cantidad Hembras
        5: { halign: "right" }, // Vr Deguello
        6: { halign: "right" }, // Ser. Matadero
        7: { halign: "right" }, // Fedegan
        8: { halign: "right" }, // Total
      },
      didParseCell: (data) => {
        // Estilo para la fila de totales
        const lastRowIndex = rows.length - 1
        if (data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = "bold"
          data.cell.styles.fillColor = [240, 240, 240]
        }
      },
    })

    // Agregar número de página
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 20,
        doc.internal.pageSize.getHeight() - 10,
      )
    }

    // Convertir el PDF a un ArrayBuffer
    const pdfOutput = doc.output("arraybuffer")

    // Devolver el archivo PDF
    return new NextResponse(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="boletin-movimiento-bovinos-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
