import { type NextRequest, NextResponse } from "next/server"
import PDFDocument from "pdfkit"

// Interfaces para los datos
interface BoletinItem {
  Fecha: string
  "G/ Deguello": string
  Cantidad: string
  "Cantidad Machos": string
  "Cantidad Hembras": string
  "Vr Deguello": string
  "Ser. Matadero": string
  Entidad: string
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
        acc.total += Number.parseInt(item.Total?.replace(/,/g, "") || "0", 10) || 0
        return acc
      },
      {
        cantidad: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        vrDeguello: 0,
        serMatadero: 0,
        total: 0,
      },
    )

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" })

    // Buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    // Configurar fuentes y estilos
    doc.font("Helvetica-Bold")
    doc.fontSize(16)
    doc.text(data.title || `Boletín Movimiento de Ganado - ${data.boletinNumber}`, { align: "center" })
    doc.fontSize(12)
    doc.text(`Boletín No. ${data.boletinNumber}`, { align: "center" })
    doc.moveDown()

    // Añadir información de filtros si existe
    if (data.filters) {
      doc.fontSize(10)
      if (data.filters.dateRange) {
        doc.text(`Rango de fechas: ${data.filters.dateRange}`, { align: "left" })
      }
      if (data.filters.searchTerm) {
        doc.text(`Término de búsqueda: ${data.filters.searchTerm}`, { align: "left" })
      }
      doc.moveDown()
    }

    // Definir ancho de columnas
    const pageWidth = doc.page.width - 2 * doc.page.margins.left
    const columnWidths = {
      fecha: pageWidth * 0.1,
      deguello: pageWidth * 0.1,
      cantidad: pageWidth * 0.1,
      machos: pageWidth * 0.1,
      hembras: pageWidth * 0.1,
      vrDeguello: pageWidth * 0.12,
      serMatadero: pageWidth * 0.12,
      entidad: pageWidth * 0.1,
      total: pageWidth * 0.16,
    }

    // Función para dibujar una celda de tabla
    const drawTableCell = (text: string, x: number, y: number, width: number, height: number, options: any = {}) => {
      const defaultOptions = { align: "center", valign: "center" }
      const opts = { ...defaultOptions, ...options }

      // Dibujar borde
      doc.rect(x, y, width, height).stroke()

      // Calcular posición del texto
      const textX = x + width / 2
      const textY = y + height / 2 - 5 // Ajuste para centrar verticalmente

      // Dibujar texto
      doc.text(text, textX, textY, { align: opts.align, width: width - 10 })
    }

    // Dibujar encabezados de tabla
    doc.font("Helvetica-Bold")
    doc.fontSize(10)

    let yPos = doc.y
    const rowHeight = 20
    let xPos = doc.page.margins.left

    // Encabezados
    drawTableCell("Fecha", xPos, yPos, columnWidths.fecha, rowHeight)
    xPos += columnWidths.fecha
    drawTableCell("G/ Deguello", xPos, yPos, columnWidths.deguello, rowHeight)
    xPos += columnWidths.deguello
    drawTableCell("Cantidad", xPos, yPos, columnWidths.cantidad, rowHeight)
    xPos += columnWidths.cantidad
    drawTableCell("Cant. Machos", xPos, yPos, columnWidths.machos, rowHeight)
    xPos += columnWidths.machos
    drawTableCell("Cant. Hembras", xPos, yPos, columnWidths.hembras, rowHeight)
    xPos += columnWidths.hembras
    drawTableCell("Vr. Deguello", xPos, yPos, columnWidths.vrDeguello, rowHeight)
    xPos += columnWidths.vrDeguello
    drawTableCell("Ser. Matadero", xPos, yPos, columnWidths.serMatadero, rowHeight)
    xPos += columnWidths.serMatadero
    drawTableCell("Entidad", xPos, yPos, columnWidths.entidad, rowHeight)
    xPos += columnWidths.entidad
    drawTableCell("Total", xPos, yPos, columnWidths.total, rowHeight)

    yPos += rowHeight

    // Dibujar filas de datos
    doc.font("Helvetica")

    data.data.forEach((item, index) => {
      // Verificar si necesitamos una nueva página
      if (yPos + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage()
        yPos = doc.page.margins.top

        // Repetir encabezados en la nueva página
        doc.font("Helvetica-Bold")
        xPos = doc.page.margins.left

        // Encabezados
        drawTableCell("Fecha", xPos, yPos, columnWidths.fecha, rowHeight)
        xPos += columnWidths.fecha
        drawTableCell("G/ Deguello", xPos, yPos, columnWidths.deguello, rowHeight)
        xPos += columnWidths.deguello
        drawTableCell("Cantidad", xPos, yPos, columnWidths.cantidad, rowHeight)
        xPos += columnWidths.cantidad
        drawTableCell("Cant. Machos", xPos, yPos, columnWidths.machos, rowHeight)
        xPos += columnWidths.machos
        drawTableCell("Cant. Hembras", xPos, yPos, columnWidths.hembras, rowHeight)
        xPos += columnWidths.hembras
        drawTableCell("Vr. Deguello", xPos, yPos, columnWidths.vrDeguello, rowHeight)
        xPos += columnWidths.vrDeguello
        drawTableCell("Ser. Matadero", xPos, yPos, columnWidths.serMatadero, rowHeight)
        xPos += columnWidths.serMatadero
        drawTableCell("Entidad", xPos, yPos, columnWidths.entidad, rowHeight)
        xPos += columnWidths.entidad
        drawTableCell("Total", xPos, yPos, columnWidths.total, rowHeight)

        yPos += rowHeight
        doc.font("Helvetica")
      }

      // Dibujar celdas de datos
      xPos = doc.page.margins.left

      drawTableCell(item.Fecha || "-", xPos, yPos, columnWidths.fecha, rowHeight, { align: "left" })
      xPos += columnWidths.fecha
      drawTableCell(item["G/ Deguello"] || "-", xPos, yPos, columnWidths.deguello, rowHeight, { align: "left" })
      xPos += columnWidths.deguello
      drawTableCell(item.Cantidad || "0", xPos, yPos, columnWidths.cantidad, rowHeight, { align: "right" })
      xPos += columnWidths.cantidad
      drawTableCell(item["Cantidad Machos"] || "0", xPos, yPos, columnWidths.machos, rowHeight, { align: "right" })
      xPos += columnWidths.machos
      drawTableCell(item["Cantidad Hembras"] || "0", xPos, yPos, columnWidths.hembras, rowHeight, { align: "right" })
      xPos += columnWidths.hembras
      drawTableCell(item["Vr Deguello"] || "0", xPos, yPos, columnWidths.vrDeguello, rowHeight, { align: "right" })
      xPos += columnWidths.vrDeguello
      drawTableCell(item["Ser. Matadero"] || "0", xPos, yPos, columnWidths.serMatadero, rowHeight, { align: "right" })
      xPos += columnWidths.serMatadero
      drawTableCell(item.Entidad || "Otro", xPos, yPos, columnWidths.entidad, rowHeight, { align: "center" })
      xPos += columnWidths.entidad
      drawTableCell(item.Total || "0", xPos, yPos, columnWidths.total, rowHeight, { align: "right" })

      yPos += rowHeight
    })

    // Dibujar fila de totales
    doc.font("Helvetica-Bold")

    // Verificar si necesitamos una nueva página para los totales
    if (yPos + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      yPos = doc.page.margins.top
    }

    xPos = doc.page.margins.left

    drawTableCell("TOTALES", xPos, yPos, columnWidths.fecha + columnWidths.deguello, rowHeight, { align: "left" })
    xPos += columnWidths.fecha + columnWidths.deguello
    drawTableCell(totales.cantidad.toLocaleString(), xPos, yPos, columnWidths.cantidad, rowHeight, { align: "right" })
    xPos += columnWidths.cantidad
    drawTableCell(totales.cantidadMachos.toLocaleString(), xPos, yPos, columnWidths.machos, rowHeight, {
      align: "right",
    })
    xPos += columnWidths.machos
    drawTableCell(totales.cantidadHembras.toLocaleString(), xPos, yPos, columnWidths.hembras, rowHeight, {
      align: "right",
    })
    xPos += columnWidths.hembras
    drawTableCell(totales.vrDeguello.toLocaleString(), xPos, yPos, columnWidths.vrDeguello, rowHeight, {
      align: "right",
    })
    xPos += columnWidths.vrDeguello
    drawTableCell(totales.serMatadero.toLocaleString(), xPos, yPos, columnWidths.serMatadero, rowHeight, {
      align: "right",
    })
    xPos += columnWidths.serMatadero
    drawTableCell("-", xPos, yPos, columnWidths.entidad, rowHeight, { align: "center" })
    xPos += columnWidths.entidad
    drawTableCell(totales.total.toLocaleString(), xPos, yPos, columnWidths.total, rowHeight, { align: "right" })

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
              "Content-Disposition": `attachment; filename="boletin_movimiento_ganado_${data.boletinNumber}.pdf"`,
            },
          }),
        )
      })

      doc.on("error", (err) => {
        reject(err)
      })
    })
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    return NextResponse.json({ error: "Error al exportar a PDF" }, { status: 500 })
  }
}
