import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import PDFDocument from "pdfkit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || undefined
    const estado = searchParams.get("estado") || undefined
    const fechaDesde = searchParams.get("fechaDesde") || undefined
    const fechaHasta = searchParams.get("fechaHasta") || undefined

    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    // Construir la consulta base
    let queryBase = `
      SELECT 
        t.id,
        t.fecha_documento as fecha,
        t.numero_documento as numero_guia,
        tl.ticket,
        tl.ticket2,
        c.primer_nombre || ' ' || c.primer_apellido as propietario,
        c.nit,
        p.name as tipo,
        r.name as raza,
        col.name as color,
        g.name as genero,
        tl.quantity as kilos,
        tl.valor,
        CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
        t.business_location_id
      FROM transactions t
      JOIN transaction_lines tl ON t.id = tl.transaction_id
      LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors col ON tl.color_id = col.id
      LEFT JOIN generos g ON tl.genero_id = g.id
      WHERE t.activo = TRUE AND t.type = 'entry' AND tl.ticket IS NOT NULL
    `

    // Agregar condiciones según los parámetros
    const conditions = []
    const params = []

    if (locationId) {
      conditions.push(`t.business_location_id = $${params.length + 1}`)
      params.push(locationId)
    }

    if (estado && estado !== "todos") {
      conditions.push(`tl.activo = $${params.length + 1}`)
      params.push(estado === "activo")
    }

    if (fechaDesde) {
      conditions.push(`t.fecha_documento >= $${params.length + 1}`)
      params.push(fechaDesde)
    }

    if (fechaHasta) {
      conditions.push(`t.fecha_documento <= $${params.length + 1}`)
      params.push(fechaHasta)
    }

    // Agregar las condiciones a la consulta base
    if (conditions.length > 0) {
      queryBase += ` AND ${conditions.join(" AND ")}`
    }

    // Agregar ordenamiento
    queryBase += ` ORDER BY tl.ticket DESC`

    // Ejecutar la consulta
    const result = await sql.query(queryBase, params)
    const tickets = result.rows

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
    })

    // Configurar el buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    // Título del documento
    doc.fontSize(16).text("SOCIEDAD DE AGRICULTORES Y GANADEROS DEL VALLE", { align: "center" })
    doc.fontSize(14).text(`Reporte de Tickets - ${tipo ? (tipo === "bovino" ? "Bovinos" : "Porcinos") : "Todos"}`, {
      align: "center",
    })
    doc.moveDown()

    // Fecha del reporte y filtros aplicados
    doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString("es-CO")}`, { align: "right" })

    // Mostrar filtros aplicados
    const filtrosTexto = "Filtros aplicados: "
    const filtros = []

    if (fechaDesde) {
      filtros.push(`Desde: ${new Date(fechaDesde).toLocaleDateString("es-CO")}`)
    }

    if (fechaHasta) {
      filtros.push(`Hasta: ${new Date(fechaHasta).toLocaleDateString("es-CO")}`)
    }

    if (estado && estado !== "todos") {
      filtros.push(`Estado: ${estado}`)
    }

    if (tipo) {
      filtros.push(`Tipo: ${tipo === "bovino" ? "Bovinos" : "Porcinos"}`)
    }

    if (filtros.length > 0) {
      doc.text(filtrosTexto + filtros.join(", "), { align: "left" })
    }

    doc.moveDown()

    // Definir las columnas de la tabla
    const tableTop = 120
    const tableLeft = 30
    const colWidths = [60, 60, 60, 120, 60, 60, 60, 60, 40, 40, 60, 50]
    const colTitles = [
      "Nº Ticket",
      "Nº Guía",
      "Fecha",
      "Propietario",
      "NIT",
      "Tipo",
      "Raza",
      "Color",
      "Género",
      "Kilos",
      "Valor",
      "Estado",
    ]

    // Dibujar la cabecera de la tabla
    doc
      .fillColor("#333333")
      .rect(tableLeft, tableTop - 5, doc.page.width - 60, 25)
      .fill()
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
    let xPos = tableLeft
    colTitles.forEach((title, i) => {
      doc.text(title, xPos, tableTop, { width: colWidths[i], align: "center" })
      xPos += colWidths[i]
    })

    // Dibujar las filas de datos
    doc.font("Helvetica").fillColor("black")
    let yPos = tableTop + 25

    tickets.forEach((ticket, index) => {
      // Alternar colores de fondo para las filas
      if (index % 2 === 0) {
        doc.fillColor("#f2f2f2")
        doc.rect(tableLeft, yPos - 5, doc.page.width - 60, 20).fill()
        doc.fillColor("black")
      }

      xPos = tableLeft

      // Formatear la fecha
      const fecha = ticket.fecha ? new Date(ticket.fecha).toLocaleDateString("es-CO") : ""

      // Formatear valores numéricos
      const kilos = ticket.kilos ? ticket.kilos.toLocaleString("es-CO", { maximumFractionDigits: 0 }) : "0"
      const valor = ticket.valor ? ticket.valor.toLocaleString("es-CO", { maximumFractionDigits: 0 }) : "0"

      // Datos de la fila
      const rowData = [
        ticket.ticket2 || "",
        ticket.numero_guia || "",
        fecha,
        ticket.propietario || "",
        ticket.nit || "",
        ticket.tipo || "",
        ticket.raza || "",
        ticket.color || "",
        ticket.genero || "",
        kilos,
        valor,
        ticket.estado || "",
      ]

      // Escribir los datos de la fila
      rowData.forEach((data, i) => {
        doc.text(data, xPos, yPos, { width: colWidths[i], align: i >= 9 && i <= 10 ? "right" : "left" })
        xPos += colWidths[i]
      })

      yPos += 20

      // Si llegamos al final de la página, crear una nueva
      if (yPos > doc.page.height - 50) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 30 })

        // Repetir la cabecera en la nueva página
        doc
          .fillColor("#333333")
          .rect(tableLeft, 40, doc.page.width - 60, 25)
          .fill()
        doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
        xPos = tableLeft
        colTitles.forEach((title, i) => {
          doc.text(title, xPos, 45, { width: colWidths[i], align: "center" })
          xPos += colWidths[i]
        })

        doc.font("Helvetica").fillColor("black")
        yPos = 70
      }
    })

    // Finalizar el documento
    doc.end()

    // Esperar a que se complete la generación del PDF
    return new Promise<NextResponse>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(pdfBuffer, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="tickets_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.pdf"`,
            },
          }),
        )
      })
    })
  } catch (error) {
    console.error("Error al exportar tickets a PDF:", error)
    return NextResponse.json({ error: "Error al exportar tickets a PDF" }, { status: 500 })
  }
}
