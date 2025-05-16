import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

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
  data: BoletinItem[]
  boletinNumber: string
  totals: {
    cantidad: number
    cantidadMachos: number
    cantidadHembras: number
    vrDeguello: number
    serMatadero: number
    porcicultura: number
    total: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos de la solicitud
    const data: ExportData = await request.json()

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })

    // Buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    // Configurar fuentes y estilos
    doc.font("Helvetica-Bold")
    doc.fontSize(14)
    doc.text("CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA", { align: "center" })
    doc.moveDown(0.5)
    doc.text("BOLETIN MOVIMIENTO DE GANADO MENOR (PORCINOS)", { align: "center" })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Boletín No. ${data.boletinNumber}`, { align: "center" })
    doc.moveDown(1)

    // Tabla de resumen
    doc.fontSize(12)
    doc.text("RESUMEN DE SACRIFICIOS", { align: "center" })
    doc.moveDown(1)

    // Crear tabla simple
    const tableTop = doc.y
    const tableLeft = 100
    const colWidth = 150

    // Datos de resumen
    doc.font("Helvetica")
    doc.text("Cantidad Total:", tableLeft, tableTop)
    doc.text(data.totals.cantidad.toLocaleString(), tableLeft + colWidth, tableTop)
    doc.moveDown(0.5)

    doc.text("Cantidad Machos:", tableLeft, doc.y)
    doc.text(data.totals.cantidadMachos.toLocaleString(), tableLeft + colWidth, doc.y)
    doc.moveDown(0.5)

    doc.text("Cantidad Hembras:", tableLeft, doc.y)
    doc.text(data.totals.cantidadHembras.toLocaleString(), tableLeft + colWidth, doc.y)
    doc.moveDown(0.5)

    doc.text("Valor Deguello:", tableLeft, doc.y)
    doc.text(`$${data.totals.vrDeguello.toLocaleString()}`, tableLeft + colWidth, doc.y)
    doc.moveDown(0.5)

    doc.text("Servicio Matadero:", tableLeft, doc.y)
    doc.text(`$${data.totals.serMatadero.toLocaleString()}`, tableLeft + colWidth, doc.y)
    doc.moveDown(0.5)

    doc.text("Porcicultura:", tableLeft, doc.y)
    doc.text(`$${data.totals.porcicultura.toLocaleString()}`, tableLeft + colWidth, doc.y)
    doc.moveDown(0.5)

    // Línea antes del total
    doc
      .moveTo(tableLeft, doc.y)
      .lineTo(tableLeft + colWidth * 2, doc.y)
      .stroke()
    doc.moveDown(0.5)

    // Total
    doc.font("Helvetica-Bold")
    doc.text("TOTAL:", tableLeft, doc.y)
    doc.text(`$${data.totals.total.toLocaleString()}`, tableLeft + colWidth, doc.y)
    doc.moveDown(2)

    // Firmas
    const signatureY = doc.y + 50
    const signatureWidth = 200

    // Firma izquierda
    doc.font("Helvetica")
    doc
      .moveTo(tableLeft, signatureY)
      .lineTo(tableLeft + signatureWidth - 50, signatureY)
      .stroke()
    doc.text("Elaboró", tableLeft, signatureY + 5, { width: signatureWidth - 50, align: "center" })

    // Firma derecha
    doc
      .moveTo(tableLeft + colWidth, signatureY)
      .lineTo(tableLeft + colWidth + signatureWidth - 50, signatureY)
      .stroke()
    doc.text("Revisó", tableLeft + colWidth, signatureY + 5, { width: signatureWidth - 50, align: "center" })

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
              "Content-Disposition": `attachment; filename="boletin_porcinos_${data.boletinNumber}.pdf"`,
            },
          }),
        )
      })

      doc.on("error", (err) => {
        console.error("Error al generar PDF:", err)
        reject(NextResponse.json({ error: "Error al generar PDF", details: err.message }, { status: 500 }))
      })
    })
  } catch (error: any) {
    console.error("Error al exportar a PDF:", error)
    return NextResponse.json({ error: "Error al exportar a PDF", details: error.message }, { status: 500 })
  }
}
