import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { formatCurrency } from "@/lib/utils"

// Configurar la ruta para que se ejecute en el entorno Node.js
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { title, data, boletinNumber, filters } = await request.json()

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []

    // Capturar los chunks del PDF
    doc.on("data", (chunk) => chunks.push(chunk))

    // Título
    doc.fontSize(16).text(title, { align: "center" })
    doc.moveDown()

    // Información de filtros
    if (filters?.dateRange) {
      doc.fontSize(10).text(`Rango de fechas: ${filters.dateRange}`, { align: "center" })
    }
    if (filters?.searchTerm) {
      doc.fontSize(10).text(`Búsqueda: ${filters.searchTerm}`, { align: "center" })
    }
    doc.moveDown()

    // Crear tabla
    const tableTop = 150
    const tableLeft = 50
    const colWidths = [80, 50, 50, 80, 80, 60, 60]
    const colTitles = [
      "G/ Deguello",
      "Cantidad",
      "Cantidad Machos",
      "Cantidad Hembras",
      "Vr Deguello",
      "Ser. Matadero",
      "Fedegan",
      "Total",
    ]

    // Encabezados de la tabla
    doc.font("Helvetica-Bold").fontSize(10)
    let currentLeft = tableLeft

    colTitles.forEach((title, index) => {
      doc.text(title, currentLeft, tableTop)
      currentLeft += colWidths[index] || 60
    })

    // Línea horizontal después de los encabezados
    doc
      .moveTo(tableLeft, tableTop + 20)
      .lineTo(tableLeft + 540, tableTop + 20)
      .stroke()

    // Datos de la tabla
    doc.font("Helvetica").fontSize(10)
    let currentTop = tableTop + 30

    data.forEach((item: any) => {
      currentLeft = tableLeft

      // Omitir la columna de fecha
      doc.text(item["G/ Deguello"] || "", currentLeft, currentTop)
      currentLeft += colWidths[0]

      doc.text(item["Cantidad"] || "", currentLeft, currentTop)
      currentLeft += colWidths[1]

      doc.text(item["Cantidad Machos"] || "", currentLeft, currentTop)
      currentLeft += colWidths[2]

      doc.text(item["Cantidad Hembras"] || "", currentLeft, currentTop)
      currentLeft += colWidths[3]

      doc.text(formatCurrency(item["Vr Deguello"]) || "", currentLeft, currentTop)
      currentLeft += colWidths[4]

      doc.text(formatCurrency(item["Ser. Matadero"]) || "", currentLeft, currentTop)
      currentLeft += colWidths[5]

      doc.text(formatCurrency(item["Fedegan"]) || "", currentLeft, currentTop)
      currentLeft += colWidths[6]

      doc.text(formatCurrency(item["Total"]) || "", currentLeft, currentTop)

      currentTop += 20

      // Agregar nueva página si es necesario
      if (currentTop > 700) {
        doc.addPage()
        currentTop = 50
      }
    })

    // Finalizar el documento
    doc.end()

    // Esperar a que se complete la generación del PDF
    return new Promise<NextResponse>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        const response = new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="boletin_diario_deguello_gm_${boletinNumber}.pdf"`,
          },
        })
        resolve(response)
      })
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
