import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"
import { formatCurrency } from "@/lib/utils"

// Especificar el runtime de Node.js para asegurar que PDFKit funcione correctamente
export const runtime = "nodejs"

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
  totals: {
    totalDeguello: number
    totalServicioMatadero: number
    totalPorcicultura: number
    totalGeneral: number
    totalCantidad: number
    totalMachos: number
    totalHembras: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json()

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })

    // Buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    // Configurar fuentes y estilos
    doc.font("Helvetica-Bold")
    doc.fontSize(14)
    doc.text(data.title, { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Boletín No. ${data.boletinNumber}`, { align: "center" })
    doc.moveDown(0.5)

    const today = new Date()
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`
    doc.text(`Fecha: ${formattedDate}`, { align: "center" })
    doc.moveDown(1)

    // Tabla de datos
    doc.font("Helvetica-Bold")
    doc.fontSize(10)
    doc.text("RESUMEN DE SACRIFICIOS", { align: "center" })
    doc.moveDown(0.5)

    // Crear tabla
    const tableTop = doc.y
    const tableLeft = 50
    const colWidth = (doc.page.width - 100) / 3

    // Encabezados
    doc.font("Helvetica-Bold")
    doc.text("CONCEPTO", tableLeft, tableTop)
    doc.text("CANTIDAD", tableLeft + colWidth, tableTop, { width: colWidth, align: "center" })
    doc.text("VALOR", tableLeft + colWidth * 2, tableTop, { width: colWidth, align: "right" })

    doc
      .moveTo(tableLeft, tableTop - 5)
      .lineTo(tableLeft + colWidth * 3, tableTop - 5)
      .stroke()

    doc
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(tableLeft + colWidth * 3, tableTop + 15)
      .stroke()

    // Datos
    let rowY = tableTop + 25
    doc.font("Helvetica")

    // Fila: Cantidad de Animales
    doc.text("Cantidad de Animales", tableLeft, rowY)
    doc.text(data.totals.totalCantidad.toLocaleString(), tableLeft + colWidth, rowY, {
      width: colWidth,
      align: "center",
    })
    doc.text("", tableLeft + colWidth * 2, rowY, { width: colWidth, align: "right" })
    rowY += 20

    // Fila: Machos
    doc.text("Machos", tableLeft, rowY)
    doc.text(data.totals.totalMachos.toLocaleString(), tableLeft + colWidth, rowY, { width: colWidth, align: "center" })
    doc.text("", tableLeft + colWidth * 2, rowY, { width: colWidth, align: "right" })
    rowY += 20

    // Fila: Hembras
    doc.text("Hembras", tableLeft, rowY)
    doc.text(data.totals.totalHembras.toLocaleString(), tableLeft + colWidth, rowY, {
      width: colWidth,
      align: "center",
    })
    doc.text("", tableLeft + colWidth * 2, rowY, { width: colWidth, align: "right" })
    rowY += 20

    // Fila: Valor Deguello
    doc.text("Valor Deguello", tableLeft, rowY)
    doc.text("", tableLeft + colWidth, rowY, { width: colWidth, align: "center" })
    doc.text(formatCurrency(data.totals.totalDeguello), tableLeft + colWidth * 2, rowY, {
      width: colWidth,
      align: "right",
    })
    rowY += 20

    // Fila: Servicio Matadero
    doc.text("Servicio Matadero", tableLeft, rowY)
    doc.text("", tableLeft + colWidth, rowY, { width: colWidth, align: "center" })
    doc.text(formatCurrency(data.totals.totalServicioMatadero), tableLeft + colWidth * 2, rowY, {
      width: colWidth,
      align: "right",
    })
    rowY += 20

    // Fila: Porcicultura
    doc.text("Porcicultura", tableLeft, rowY)
    doc.text("", tableLeft + colWidth, rowY, { width: colWidth, align: "center" })
    doc.text(formatCurrency(data.totals.totalPorcicultura), tableLeft + colWidth * 2, rowY, {
      width: colWidth,
      align: "right",
    })
    rowY += 20

    // Línea antes del total
    doc
      .moveTo(tableLeft, rowY - 5)
      .lineTo(tableLeft + colWidth * 3, rowY - 5)
      .stroke()

    // Fila: Total
    doc.font("Helvetica-Bold")
    doc.text("TOTAL", tableLeft, rowY)
    doc.text("", tableLeft + colWidth, rowY, { width: colWidth, align: "center" })
    doc.text(formatCurrency(data.totals.totalGeneral), tableLeft + colWidth * 2, rowY, {
      width: colWidth,
      align: "right",
    })

    // Línea después del total
    doc
      .moveTo(tableLeft, rowY + 15)
      .lineTo(tableLeft + colWidth * 3, rowY + 15)
      .stroke()

    // Firmas
    rowY += 100
    const signatureWidth = (doc.page.width - 100) / 2

    doc.fontSize(10)
    doc.font("Helvetica")

    // Firma izquierda
    doc
      .moveTo(tableLeft, rowY)
      .lineTo(tableLeft + signatureWidth - 20, rowY)
      .stroke()
    doc.text("Elaboró", tableLeft, rowY + 5, { width: signatureWidth - 20, align: "center" })

    // Firma derecha
    doc
      .moveTo(tableLeft + signatureWidth + 20, rowY)
      .lineTo(tableLeft + signatureWidth * 2, rowY)
      .stroke()
    doc.text("Revisó", tableLeft + signatureWidth + 20, rowY + 5, { width: signatureWidth - 20, align: "center" })

    // Finalizar el documento
    doc.end()

    // Esperar a que se complete la generación del PDF
    return new Promise<NextResponse>((resolve, reject) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="Boletin_Movimiento_Ganado_Menor_${data.boletinNumber}.pdf"`,
            },
          }),
        )
      })

      doc.on("error", (err) => {
        console.error("Error al generar PDF:", err)
        reject(err)
      })
    })
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    return NextResponse.json({ error: "Error al exportar a PDF" }, { status: 500 })
  }
}
