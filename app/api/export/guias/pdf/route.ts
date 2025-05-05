import { NextResponse } from "next/server"
import { getTransactions } from "@/lib/data"
import PDFDocument from "pdfkit"

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url)
    const tipo = url.searchParams.get("tipo") || undefined
    const estado = url.searchParams.get("estado") || undefined

    // Obtener las guías
    let guias = await getTransactions("entry", tipo)

    // Filtrar por estado si se especifica
    if (estado && estado !== "todas") {
      guias = guias.filter((g) => g.estado === estado)
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on("data", (chunk) => chunks.push(chunk))

    // Título
    doc.fontSize(20).text("Reporte de Guías ICA", { align: "center" })
    doc.moveDown()

    // Fecha de generación
    doc.fontSize(10).text(`Generado el: ${new Date().toLocaleDateString("es-CO")}`, { align: "right" })
    doc.moveDown(2)

    // Tabla de guías
    const tableTop = 150
    const tableLeft = 50
    const colWidths = [60, 70, 100, 100, 40, 40, 50, 70, 70]
    const rowHeight = 20

    // Encabezados
    doc.font("Helvetica-Bold")
    const headers = [
      "Número",
      "Fecha",
      "Dueño Anterior",
      "Dueño Nuevo",
      "Machos",
      "Hembras",
      "Kilos",
      "Estado",
      "Total",
    ]

    let currentLeft = tableLeft
    headers.forEach((header, i) => {
      doc.text(header, currentLeft, tableTop)
      currentLeft += colWidths[i]
    })

    // Línea después de encabezados
    doc
      .moveTo(tableLeft, tableTop + rowHeight - 5)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + rowHeight - 5)
      .stroke()

    // Datos
    doc.font("Helvetica")
    let currentTop = tableTop + rowHeight

    guias.forEach((guia, index) => {
      // Alternar color de fondo
      if (index % 2 === 0) {
        doc
          .rect(
            tableLeft,
            currentTop,
            colWidths.reduce((a, b) => a + b, 0),
            rowHeight,
          )
          .fill("#f9f9f9")
          .stroke("#f9f9f9")
      }

      currentLeft = tableLeft

      // Número
      doc.fillColor("black").text(guia.numero_documento || "", currentLeft, currentTop + 5, { width: colWidths[0] })
      currentLeft += colWidths[0]

      // Fecha
      doc.text(new Date(guia.fecha_documento).toLocaleDateString("es-CO"), currentLeft, currentTop + 5, {
        width: colWidths[1],
      })
      currentLeft += colWidths[1]

      // Dueño Anterior
      doc.text(guia.dueno_anterior_nombre || "N/A", currentLeft, currentTop + 5, { width: colWidths[2] })
      currentLeft += colWidths[2]

      // Dueño Nuevo
      doc.text(guia.dueno_nuevo_nombre || "N/A", currentLeft, currentTop + 5, { width: colWidths[3] })
      currentLeft += colWidths[3]

      // Machos
      doc.text((guia.quantity_m || 0).toString(), currentLeft, currentTop + 5, { width: colWidths[4] })
      currentLeft += colWidths[4]

      // Hembras
      doc.text((guia.quantity_h || 0).toString(), currentLeft, currentTop + 5, { width: colWidths[5] })
      currentLeft += colWidths[5]

      // Kilos
      doc.text((guia.quantity_k || 0).toString(), currentLeft, currentTop + 5, { width: colWidths[6] })
      currentLeft += colWidths[6]

      // Estado
      const estado = guia.estado === "confirmado" ? "Confirmado" : guia.estado === "anulado" ? "Anulado" : "Borrador"
      doc.text(estado, currentLeft, currentTop + 5, { width: colWidths[7] })
      currentLeft += colWidths[7]

      // Total
      doc.text(`$${(guia.total || 0).toLocaleString("es-CO")}`, currentLeft, currentTop + 5, { width: colWidths[8] })

      currentTop += rowHeight

      // Agregar nueva página si es necesario
      if (currentTop > doc.page.height - 100) {
        doc.addPage()
        currentTop = 50
      }
    })

    // Finalizar documento
    doc.end()

    // Esperar a que se complete la generación del PDF
    return new Promise<NextResponse>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="guias_ica_${new Date().toISOString().split("T")[0]}.pdf"`,
            },
          }),
        )
      })
    })
  } catch (error) {
    console.error("Error al exportar guías a PDF:", error)
    return NextResponse.json({ error: "Error al exportar guías a PDF" }, { status: 500 })
  }
}
