import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

// Configurar la ruta para que se ejecute en el entorno Node.js
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { title, data, boletinNumber, totals } = await request.json()

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const chunks: Buffer[] = []

    // Capturar los chunks del PDF
    doc.on("data", (chunk) => chunks.push(chunk))

    // Función para formatear moneda
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }

    // Configurar fuentes
    doc.font("Helvetica-Bold")

    // Título
    doc.fontSize(14).text(title.split("\n")[0], { align: "center" })
    doc.fontSize(12).text(title.split("\n")[1], { align: "center" })
    doc.moveDown()

    // Información del boletín
    doc.fontSize(10)
    doc.text(`Alcaldía de Popayán`, 50, 100)
    doc.text(`BOLETIN # ${boletinNumber}`, 450, 100, { align: "right" })
    doc.text(`SAG`, 50, 115)
    doc.text(`Sociedad de Agricultores y Ganaderos del Cauca`, 50, 130)
    doc.moveDown(2)

    // Crear tabla
    const tableTop = 160
    const tableLeft = 50
    const colWidths = [80, 50, 50, 50, 80, 80, 60, 60]
    const colTitles = [
      "G/Deguello",
      "Cantidad",
      "Machos",
      "Hembras",
      "Vr. Deguello",
      "Ser. Matadero",
      "Fedegan",
      "Total",
    ]

    // Encabezados de la tabla
    doc.font("Helvetica-Bold").fontSize(8)
    let currentLeft = tableLeft

    colTitles.forEach((title, i) => {
      doc.text(title, currentLeft, tableTop, { width: colWidths[i], align: "center" })
      currentLeft += colWidths[i]
    })

    // Línea horizontal después de los encabezados
    doc
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
      .stroke()

    // Datos de la tabla
    doc.font("Helvetica").fontSize(8)
    let currentTop = tableTop + 20

    data.forEach((item: any, index: number) => {
      currentLeft = tableLeft

      // G/Deguello
      doc.text(item["G/ Deguello"] || "", currentLeft, currentTop, {
        width: colWidths[0],
        align: "center",
      })
      currentLeft += colWidths[0]

      // Cantidad
      doc.text(item["Cantidad"] || "", currentLeft, currentTop, {
        width: colWidths[1],
        align: "center",
      })
      currentLeft += colWidths[1]

      // Machos
      doc.text(item["Cantidad Machos"] || "", currentLeft, currentTop, {
        width: colWidths[2],
        align: "center",
      })
      currentLeft += colWidths[2]

      // Hembras
      doc.text(item["Cantidad Hembras"] || "", currentLeft, currentTop, {
        width: colWidths[3],
        align: "center",
      })
      currentLeft += colWidths[3]

      // Vr Deguello
      doc.text(item["Vr Deguello"] || "", currentLeft, currentTop, {
        width: colWidths[4],
        align: "center",
      })
      currentLeft += colWidths[4]

      // Ser. Matadero
      doc.text(item["Ser. Matadero"] || "", currentLeft, currentTop, {
        width: colWidths[5],
        align: "center",
      })
      currentLeft += colWidths[5]

      // Fedegan
      doc.text(item["Fedegan"] || "", currentLeft, currentTop, {
        width: colWidths[6],
        align: "center",
      })
      currentLeft += colWidths[6]

      // Total
      doc.text(item["Total"] || "", currentLeft, currentTop, {
        width: colWidths[7],
        align: "center",
      })

      // Agregar "Activo" al final de cada fila
      doc.text("Activo", currentLeft + colWidths[7] + 5, currentTop, {
        width: 40,
        align: "left",
      })

      currentTop += 15

      // Agregar nueva página si es necesario
      if (currentTop > 700) {
        doc.addPage()
        currentTop = 50
      }
    })

    // Línea horizontal antes de los totales
    doc
      .moveTo(tableLeft, currentTop)
      .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), currentTop)
      .stroke()

    // Totales
    doc.font("Helvetica-Bold").fontSize(8)
    currentTop += 5
    currentLeft = tableLeft

    // TOTALES
    doc.text("TOTALES", currentLeft, currentTop, {
      width: colWidths[0],
      align: "center",
    })
    currentLeft += colWidths[0]

    // Cantidad total
    doc.text(formatCurrency(totals.totalCantidad), currentLeft, currentTop, {
      width: colWidths[1],
      align: "center",
    })
    currentLeft += colWidths[1]

    // Machos total
    doc.text(formatCurrency(totals.totalMachos), currentLeft, currentTop, {
      width: colWidths[2],
      align: "center",
    })
    currentLeft += colWidths[2]

    // Hembras total
    doc.text(formatCurrency(totals.totalHembras), currentLeft, currentTop, {
      width: colWidths[3],
      align: "center",
    })
    currentLeft += colWidths[3]

    // Vr Deguello total
    doc.text("$ " + formatCurrency(totals.totalDeguello), currentLeft, currentTop, {
      width: colWidths[4],
      align: "center",
    })
    currentLeft += colWidths[4]

    // Ser. Matadero total
    doc.text("$ " + formatCurrency(totals.totalServicioMatadero), currentLeft, currentTop, {
      width: colWidths[5],
      align: "center",
    })
    currentLeft += colWidths[5]

    // Fedegan total
    doc.text("$ " + formatCurrency(totals.totalFedegan), currentLeft, currentTop, {
      width: colWidths[6],
      align: "center",
    })
    currentLeft += colWidths[6]

    // Total general
    doc.text("$ " + formatCurrency(totals.totalGeneral), currentLeft, currentTop, {
      width: colWidths[7],
      align: "center",
    })

    // Distribución del impuesto
    currentTop += 30
    doc.fontSize(10)
    doc.text("Valor Total del Impuesto Deguello", tableLeft, currentTop)
    doc.text("$ " + formatCurrency(totals.totalDeguello), tableLeft + 300, currentTop)

    currentTop += 15
    doc.text("Alcaldía 50%", tableLeft + 20, currentTop)
    doc.text("$ " + formatCurrency(totals.totalDeguello * 0.5), tableLeft + 300, currentTop)

    currentTop += 15
    doc.text("Gobernación 50%", tableLeft + 20, currentTop)
    doc.text("$ " + formatCurrency(totals.totalDeguello * 0.5), tableLeft + 300, currentTop)

    // Sección de firmas
    currentTop += 50
    doc.fontSize(10)

    // Primera fila de firmas
    doc.text("ELABORÓ:", tableLeft, currentTop)
    doc.text("REVISÓ:", tableLeft + 200, currentTop)
    doc.text("REVISÓ:", tableLeft + 400, currentTop)

    // Líneas para firmas
    currentTop += 30
    doc
      .moveTo(tableLeft, currentTop)
      .lineTo(tableLeft + 150, currentTop)
      .stroke()
    doc
      .moveTo(tableLeft + 200, currentTop)
      .lineTo(tableLeft + 350, currentTop)
      .stroke()
    doc
      .moveTo(tableLeft + 400, currentTop)
      .lineTo(tableLeft + 550, currentTop)
      .stroke()

    // Fecha y hora de elaboración
    currentTop += 40
    const now = new Date()
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`
    doc.fontSize(8).text(`Elaborado: ${formattedDate}`, tableLeft, currentTop)

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
            "Content-Disposition": `attachment; filename="Boletin_Movimiento_Ganado_Mayor_${boletinNumber}.pdf"`,
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
