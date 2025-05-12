import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import PDFDocument from "pdfkit"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    // Consulta para obtener los sacrificios
    let query = `
      SELECT 
        t.id, 
        t.numero_documento, 
        t.fecha_documento, 
        c1.primer_nombre || ' ' || c1.primer_apellido AS dueno_anterior_nombre,
        c1.nit AS dueno_anterior_nit,
        c2.primer_nombre || ' ' || c2.primer_apellido AS dueno_nuevo_nombre,
        c2.nit AS dueno_nuevo_nit,
        t.quantity_m, 
        t.quantity_h, 
        t.quantity_k,
        t.impuesto1,
        t.impuesto2,
        t.impuesto3,
        t.refrigeration,
        t.extra_hour,
        t.total,
        t.estado,
        t.colors,
        t.consignante,
        t.planilla
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE t.type = 'exit'
    `

    if (tipo) {
      const locationId = tipo === "bovino" ? 1 : 2
      query += ` AND t.business_location_id = ${locationId}`
    }

    query += ` ORDER BY t.fecha_documento DESC`

    const result = await sql.query(query)
    const sacrificios = result.rows

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks = []

    doc.on("data", (chunk) => chunks.push(chunk))

    // Título
    doc
      .fontSize(20)
      .text(`Reporte de Sacrificios ${tipo === "bovino" ? "Bovinos" : tipo === "porcino" ? "Porcinos" : ""}`, {
        align: "center",
      })
    doc.moveDown()

    // Fecha de generación
    doc.fontSize(10).text(`Generado el: ${new Date().toLocaleDateString("es-CO")}`, { align: "right" })
    doc.moveDown(2)

    // Tabla de sacrificios
    const tableTop = 150
    const tableLeft = 50
    const colWidths = [35, 40, 70, 40, 70, 40, 30, 30, 30, 40, 40, 40, 40, 40, 40, 50]
    const rowHeight = 20

    // Encabezados
    doc.font("Helvetica-Bold")
    const headers = [
      "Guía",
      "Fecha",
      "Prop. Anterior",
      "NIT Anterior",
      "Prop. Nuevo",
      "NIT Nuevo",
      "Machos",
      "Hembras",
      "Total",
      "Kilos",
      "Degüello",
      "Fondo",
      "Matadero",
      "Refrig.",
      "H. Extras",
      "Total",
    ]

    let currentLeft = tableLeft
    headers.forEach((header, i) => {
      doc.text(header, currentLeft, tableTop, { width: colWidths[i], align: "center" })
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

    // Función para formatear números
    const formatNumber = (value) => {
      if (value === null || value === undefined || isNaN(value)) {
        return "0"
      }
      return Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

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

    sacrificios.forEach((sacrificio, index) => {
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

      // Número de guía
      doc.fillColor("black").text(sacrificio.numero_documento || "", currentLeft, currentTop + 5, {
        width: colWidths[0],
        align: "center",
      })
      currentLeft += colWidths[0]

      // Fecha
      doc.text(new Date(sacrificio.fecha_documento).toLocaleDateString("es-CO"), currentLeft, currentTop + 5, {
        width: colWidths[1],
        align: "center",
      })
      currentLeft += colWidths[1]

      // Propietario
      doc.text(sacrificio.dueno_anterior_nombre || "N/A", currentLeft, currentTop + 5, {
        width: colWidths[2],
        align: "left",
      })
      currentLeft += colWidths[2]

      // NIT
      doc.text(sacrificio.dueno_anterior_nit || "N/A", currentLeft, currentTop + 5, {
        width: colWidths[3],
        align: "center",
      })
      currentLeft += colWidths[3]

      // Propietario Nuevo
      doc.text(sacrificio.dueno_nuevo_nombre || "N/A", currentLeft, currentTop + 5, {
        width: colWidths[4],
        align: "left",
      })
      currentLeft += colWidths[4]

      // NIT Nuevo
      doc.text(sacrificio.dueno_nuevo_nit || "N/A", currentLeft, currentTop + 5, {
        width: colWidths[5],
        align: "center",
      })
      currentLeft += colWidths[5]

      // Machos
      doc.text(formatNumber(sacrificio.quantity_m || 0), currentLeft, currentTop + 5, {
        width: colWidths[6],
        align: "center",
      })
      currentLeft += colWidths[6]

      // Hembras
      doc.text(formatNumber(sacrificio.quantity_h || 0), currentLeft, currentTop + 5, {
        width: colWidths[7],
        align: "center",
      })
      currentLeft += colWidths[7]

      // Total animales
      doc.text(
        formatNumber((Number(sacrificio.quantity_m) || 0) + (Number(sacrificio.quantity_h) || 0)),
        currentLeft,
        currentTop + 5,
        {
          width: colWidths[8],
          align: "center",
        },
      )
      currentLeft += colWidths[8]

      // Kilos
      doc.text(formatNumber(sacrificio.quantity_k || 0), currentLeft, currentTop + 5, {
        width: colWidths[9],
        align: "center",
      })
      currentLeft += colWidths[9]

      // Degüello
      doc.text(formatNumber(sacrificio.impuesto1 || 0), currentLeft, currentTop + 5, {
        width: colWidths[10],
        align: "center",
      })
      currentLeft += colWidths[10]

      // Fondo
      doc.text(formatNumber(sacrificio.impuesto2 || 0), currentLeft, currentTop + 5, {
        width: colWidths[11],
        align: "center",
      })
      currentLeft += colWidths[11]

      // Matadero
      doc.text(formatNumber(sacrificio.impuesto3 || 0), currentLeft, currentTop + 5, {
        width: colWidths[12],
        align: "center",
      })
      currentLeft += colWidths[12]

      // Refrigeración
      doc.text(formatNumber(sacrificio.refrigeration || 0), currentLeft, currentTop + 5, {
        width: colWidths[13],
        align: "center",
      })
      currentLeft += colWidths[13]

      // Horas extras
      doc.text(formatNumber(sacrificio.extra_hour || 0), currentLeft, currentTop + 5, {
        width: colWidths[14],
        align: "center",
      })
      currentLeft += colWidths[14]

      // Total
      doc.text(formatNumber(sacrificio.total || 0), currentLeft, currentTop + 5, {
        width: colWidths[15],
        align: "center",
      })

      currentTop += rowHeight

      // Agregar nueva página si es necesario
      if (currentTop > doc.page.height - 100) {
        doc.addPage()
        currentTop = 50

        // Repetir encabezados en la nueva página
        currentLeft = tableLeft
        doc.font("Helvetica-Bold")
        headers.forEach((header, i) => {
          doc.text(header, currentLeft, currentTop, { width: colWidths[i], align: "center" })
          currentLeft += colWidths[i]
        })

        doc
          .moveTo(tableLeft, currentTop + rowHeight - 5)
          .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), currentTop + rowHeight - 5)
          .stroke()

        doc.font("Helvetica")
        currentTop += rowHeight
      }
    })

    // Fila de totales
    currentTop += 5
    doc
      .rect(
        tableLeft,
        currentTop,
        colWidths.reduce((a, b) => a + b, 0),
        rowHeight,
      )
      .fill("#e5e7eb")
      .stroke("#e5e7eb")

    currentLeft = tableLeft

    // Texto "TOTAL"
    doc.font("Helvetica-Bold").fillColor("black")
    doc.text("TOTAL", currentLeft, currentTop + 5, {
      width: colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5],
      align: "right",
    })
    currentLeft += colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5]

    // Machos total
    doc.text(formatNumber(totalMachos), currentLeft, currentTop + 5, {
      width: colWidths[6],
      align: "center",
    })
    currentLeft += colWidths[6]

    // Hembras total
    doc.text(formatNumber(totalHembras), currentLeft, currentTop + 5, {
      width: colWidths[7],
      align: "center",
    })
    currentLeft += colWidths[7]

    // Total animales
    doc.text(formatNumber(totalAnimales), currentLeft, currentTop + 5, {
      width: colWidths[8],
      align: "center",
    })
    currentLeft += colWidths[8]

    // Kilos total
    doc.text(formatNumber(totalKilos), currentLeft, currentTop + 5, {
      width: colWidths[9],
      align: "center",
    })
    currentLeft += colWidths[9]

    // Degüello total
    doc.text(formatNumber(totalDeguello), currentLeft, currentTop + 5, {
      width: colWidths[10],
      align: "center",
    })
    currentLeft += colWidths[10]

    // Fondo total
    doc.text(formatNumber(totalFondo), currentLeft, currentTop + 5, {
      width: colWidths[11],
      align: "center",
    })
    currentLeft += colWidths[11]

    // Matadero total
    doc.text(formatNumber(totalMatadero), currentLeft, currentTop + 5, {
      width: colWidths[12],
      align: "center",
    })
    currentLeft += colWidths[12]

    // Refrigeración total
    doc.text(formatNumber(totalRefrigeracion), currentLeft, currentTop + 5, {
      width: colWidths[13],
      align: "center",
    })
    currentLeft += colWidths[13]

    // Horas extras total
    doc.text(formatNumber(totalHorasExtras), currentLeft, currentTop + 5, {
      width: colWidths[14],
      align: "center",
    })
    currentLeft += colWidths[14]

    // Total valor
    doc.text(formatNumber(totalValor), currentLeft, currentTop + 5, {
      width: colWidths[15],
      align: "center",
    })

    // Finalizar documento
    doc.end()

    // Esperar a que se complete la generación del PDF
    return new Promise((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="sacrificios_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.pdf"`,
            },
          }),
        )
      })
    })
  } catch (error) {
    console.error("Error al exportar sacrificios a PDF:", error)
    return NextResponse.json({ error: "Error al exportar sacrificios a PDF" }, { status: 500 })
  }
}
