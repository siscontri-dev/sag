import { sql } from "@vercel/postgres"
import PDFDocument from "pdfkit"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || undefined
    const agrupacion = searchParams.get("agrupacion") || "dia" // dia o mes
    const fechaDesde = searchParams.get("fechaDesde") || undefined
    const fechaHasta = searchParams.get("fechaHasta") || undefined

    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    // Construir la consulta base - ELIMINAMOS CUALQUIER FILTRO DE FECHA POR DEFECTO
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
      WHERE t.activo = TRUE AND t.type = 'entry' AND tl.ticket IS NOT NULL AND tl.activo = TRUE
    `

    // Agregar condiciones según los parámetros
    const conditions = []
    const params = []

    if (locationId) {
      conditions.push(`t.business_location_id = $${params.length + 1}`)
      params.push(locationId)
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
    queryBase += ` ORDER BY t.fecha_documento DESC`

    // Ejecutar la consulta
    const result = await sql.query(queryBase, params)
    const tickets = result.rows

    // Verificar el rango de fechas obtenido
    if (tickets.length > 0) {
      const fechas = tickets.map((row) => new Date(row.fecha))
      const minFecha = new Date(Math.min(...fechas))
      const maxFecha = new Date(Math.max(...fechas))
      console.log(`PDF - Rango de fechas obtenido: ${minFecha.toISOString()} a ${maxFecha.toISOString()}`)
      console.log(`PDF - Total de tickets obtenidos: ${tickets.length}`)
    }

    // Procesar los datos para agruparlos
    const ticketsAgrupados = agruparTickets(tickets, agrupacion)

    // Crear un nuevo documento PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
    })

    // Configurar el buffer para almacenar el PDF
    const chunks: Buffer[] = []
    doc.on("data", (chunk) => chunks.push(chunk))

    // Promesa para completar el documento
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks)
        resolve(pdfBuffer)
      })
    })

    // Título del documento
    doc.fontSize(16).text("SOCIEDAD DE AGRICULTORES Y GANADEROS DEL VALLE", { align: "center" })
    doc
      .fontSize(14)
      .text(
        `Tickets Agrupados por ${agrupacion === "dia" ? "Día" : "Mes"} - ${tipo ? (tipo === "bovino" ? "Bovinos" : "Porcinos") : "Todos"}`,
        {
          align: "center",
        },
      )
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

    // Definir anchos de columnas
    const colWidths = {
      periodo: 80,
      machos_tickets: 80,
      machos_cantidad: 50,
      machos_valor_unitario: 60,
      machos_valor_total: 60,
      hembras_tickets: 80,
      hembras_cantidad: 50,
      hembras_valor_unitario: 60,
      hembras_valor_total: 60,
      total_cantidad: 50,
      total_valor: 60,
    }

    // Dibujar encabezado principal
    doc
      .fillColor("#333333")
      .rect(tableLeft, tableTop - 5, doc.page.width - 60, 25)
      .fill()
    doc.fillColor("white").fontSize(10).font("Helvetica-Bold")

    // Encabezados de grupo
    doc.text(agrupacion === "dia" ? "Fecha" : "Mes", tableLeft, tableTop, { width: colWidths.periodo, align: "center" })

    const xPosMachos = tableLeft + colWidths.periodo
    doc.text("Machos", xPosMachos, tableTop, {
      width:
        colWidths.machos_tickets +
        colWidths.machos_cantidad +
        colWidths.machos_valor_unitario +
        colWidths.machos_valor_total,
      align: "center",
    })

    const xPosHembras =
      xPosMachos +
      colWidths.machos_tickets +
      colWidths.machos_cantidad +
      colWidths.machos_valor_unitario +
      colWidths.machos_valor_total
    doc.text("Hembras", xPosHembras, tableTop, {
      width:
        colWidths.hembras_tickets +
        colWidths.hembras_cantidad +
        colWidths.hembras_valor_unitario +
        colWidths.hembras_valor_total,
      align: "center",
    })

    // Dibujar subencabezados
    doc
      .fillColor("#666666")
      .rect(tableLeft, tableTop + 20, doc.page.width - 60, 20)
      .fill()
    doc.fillColor("white").fontSize(8)

    let currentX = tableLeft
    doc.text("Fecha", currentX, tableTop + 25, { width: colWidths.periodo, align: "center" })
    currentX += colWidths.periodo

    // Subencabezados Machos
    doc.text("Tickets (Rango)", currentX, tableTop + 25, { width: colWidths.machos_tickets, align: "center" })
    currentX += colWidths.machos_tickets
    doc.text("Cantidad", currentX, tableTop + 25, { width: colWidths.machos_cantidad, align: "center" })
    currentX += colWidths.machos_cantidad
    doc.text("Valor Unitario", currentX, tableTop + 25, { width: colWidths.machos_valor_unitario, align: "center" })
    currentX += colWidths.machos_valor_unitario
    doc.text("Valor Total", currentX, tableTop + 25, { width: colWidths.machos_valor_total, align: "center" })
    currentX += colWidths.machos_valor_total

    // Subencabezados Hembras
    doc.text("Tickets (Rango)", currentX, tableTop + 25, { width: colWidths.hembras_tickets, align: "center" })
    currentX += colWidths.hembras_tickets
    doc.text("Cantidad", currentX, tableTop + 25, { width: colWidths.hembras_cantidad, align: "center" })
    currentX += colWidths.hembras_cantidad
    doc.text("Valor Unitario", currentX, tableTop + 25, { width: colWidths.hembras_valor_unitario, align: "center" })
    currentX += colWidths.hembras_valor_unitario
    doc.text("Valor Total", currentX, tableTop + 25, { width: colWidths.hembras_valor_total, align: "center" })

    // Dibujar filas de datos
    let yPos = tableTop + 45
    doc.fillColor("black").fontSize(8)

    ticketsAgrupados.forEach((grupo, index) => {
      // Alternar colores de fondo para las filas
      if (index % 2 === 0) {
        doc
          .fillColor("#f5f5f5")
          .rect(tableLeft, yPos - 5, doc.page.width - 60, 20)
          .fill()
      }
      doc.fillColor("black")

      // Verificar si necesitamos una nueva página
      if (yPos > doc.page.height - 50) {
        doc.addPage()
        yPos = 50
      }

      // Dibujar datos
      currentX = tableLeft
      doc.text(grupo.periodo, currentX, yPos, { width: colWidths.periodo, align: "center" })
      currentX += colWidths.periodo

      // Datos Machos
      doc.text(grupo.machos.ticketsRango, currentX, yPos, { width: colWidths.machos_tickets, align: "center" })
      currentX += colWidths.machos_tickets
      doc.text(grupo.machos.cantidad.toString(), currentX, yPos, { width: colWidths.machos_cantidad, align: "right" })
      currentX += colWidths.machos_cantidad
      doc.text(formatCurrency(grupo.machos.valorUnitario), currentX, yPos, {
        width: colWidths.machos_valor_unitario,
        align: "right",
      })
      currentX += colWidths.machos_valor_unitario
      doc.text(formatCurrency(grupo.machos.valorTotal), currentX, yPos, {
        width: colWidths.machos_valor_total,
        align: "right",
      })
      currentX += colWidths.machos_valor_total

      // Datos Hembras
      doc.text(grupo.hembras.ticketsRango, currentX, yPos, { width: colWidths.hembras_tickets, align: "center" })
      currentX += colWidths.hembras_tickets
      doc.text(grupo.hembras.cantidad.toString(), currentX, yPos, { width: colWidths.hembras_cantidad, align: "right" })
      currentX += colWidths.hembras_cantidad
      doc.text(formatCurrency(grupo.hembras.valorUnitario), currentX, yPos, {
        width: colWidths.hembras_valor_unitario,
        align: "right",
      })
      currentX += colWidths.hembras_valor_unitario
      doc.text(formatCurrency(grupo.hembras.valorTotal), currentX, yPos, {
        width: colWidths.hembras_valor_total,
        align: "right",
      })

      yPos += 20
    })

    // Dibujar fila de totales
    doc
      .fillColor("#e0e0e0")
      .rect(tableLeft, yPos - 5, doc.page.width - 60, 20)
      .fill()
    doc.fillColor("black").font("Helvetica-Bold")

    // Calcular totales
    const totales = {
      machos: {
        cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.machos.cantidad, 0),
        valorTotal: ticketsAgrupados.reduce((sum, item) => sum + item.machos.valorTotal, 0),
      },
      hembras: {
        cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.cantidad, 0),
        valorTotal: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.valorTotal, 0),
      },
    }

    totales.machos.valorUnitario = totales.machos.cantidad > 0 ? totales.machos.valorTotal / totales.machos.cantidad : 0
    totales.hembras.valorUnitario =
      totales.hembras.cantidad > 0 ? totales.hembras.valorTotal / totales.hembras.cantidad : 0

    // Dibujar totales
    currentX = tableLeft
    doc.text("TOTALES", currentX, yPos, { width: colWidths.periodo, align: "center" })
    currentX += colWidths.periodo

    // Totales Machos
    doc.text("-", currentX, yPos, { width: colWidths.machos_tickets, align: "center" })
    currentX += colWidths.machos_tickets
    doc.text(totales.machos.cantidad.toString(), currentX, yPos, { width: colWidths.machos_cantidad, align: "right" })
    currentX += colWidths.machos_cantidad
    doc.text(formatCurrency(totales.machos.valorUnitario), currentX, yPos, {
      width: colWidths.machos_valor_unitario,
      align: "right",
    })
    currentX += colWidths.machos_valor_unitario
    doc.text(formatCurrency(totales.machos.valorTotal), currentX, yPos, {
      width: colWidths.machos_valor_total,
      align: "right",
    })
    currentX += colWidths.machos_valor_total

    // Totales Hembras
    doc.text("-", currentX, yPos, { width: colWidths.hembras_tickets, align: "center" })
    currentX += colWidths.hembras_tickets
    doc.text(totales.hembras.cantidad.toString(), currentX, yPos, { width: colWidths.hembras_cantidad, align: "right" })
    currentX += colWidths.hembras_cantidad
    doc.text(formatCurrency(totales.hembras.valorUnitario), currentX, yPos, {
      width: colWidths.hembras_valor_unitario,
      align: "right",
    })
    currentX += colWidths.hembras_valor_unitario
    doc.text(formatCurrency(totales.hembras.valorTotal), currentX, yPos, {
      width: colWidths.hembras_valor_total,
      align: "right",
    })

    // Finalizar el documento
    doc.end()

    // Esperar a que se complete el PDF
    const pdfBuffer = await pdfPromise

    // Devolver la respuesta
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tickets_agrupados_${agrupacion}_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar tickets agrupados a PDF:", error)
    return NextResponse.json({ error: "Error al exportar tickets agrupados a PDF" }, { status: 500 })
  }
}

// Función para agrupar tickets por día o mes
function agruparTickets(tickets, agrupacion) {
  const agrupados = {}

  // Imprimir información de depuración
  console.log(`Agrupando ${tickets.length} tickets por ${agrupacion}`)

  // Verificar rango de fechas
  if (tickets.length > 0) {
    const fechas = tickets.map((t) => new Date(t.fecha))
    const minFecha = new Date(Math.min(...fechas))
    const maxFecha = new Date(Math.max(...fechas))
    console.log(`Rango de fechas en tickets: ${minFecha.toLocaleDateString()} - ${maxFecha.toLocaleDateString()}`)
  }

  tickets.forEach((ticket) => {
    // Asegurarse de que ticket.fecha es una fecha válida
    if (!ticket.fecha) {
      console.log(`Ticket sin fecha: ${ticket.ticket || ticket.ticket2}`)
      return
    }

    const fecha = new Date(ticket.fecha)
    let periodoKey
    let periodoLabel

    if (agrupacion === "dia") {
      // Usar formato YYYY-MM-DD para la clave
      const year = fecha.getFullYear()
      const month = String(fecha.getMonth() + 1).padStart(2, "0")
      const day = String(fecha.getDate()).padStart(2, "0")
      periodoKey = `${year}-${month}-${day}`

      periodoLabel = fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } else {
      // mes - Usar formato YYYY-MM para la clave
      const year = fecha.getFullYear()
      const month = String(fecha.getMonth() + 1).padStart(2, "0")
      periodoKey = `${year}-${month}`

      periodoLabel = fecha.toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric",
      })
    }

    // Determinar el género - normalizar a mayúsculas y manejar casos especiales
    let genero = "otros"
    if (ticket.genero) {
      const generoNormalizado = ticket.genero.toString().trim().toUpperCase()
      if (generoNormalizado === "M" || generoNormalizado === "MACHO") {
        genero = "machos"
      } else if (generoNormalizado === "H" || generoNormalizado === "HEMBRA") {
        genero = "hembras"
      }
    }

    // Imprimir para depuración
    console.log(
      `Procesando ticket: fecha=${ticket.fecha}, periodoKey=${periodoKey}, genero=${genero}, ticket=${ticket.ticket}, ticket2=${ticket.ticket2}`,
    )

    if (!agrupados[periodoKey]) {
      agrupados[periodoKey] = {
        periodoKey,
        periodo: periodoLabel,
        machos: {
          tickets: [],
          cantidad: 0,
          valorTotal: 0,
          valorUnitario: 0,
        },
        hembras: {
          tickets: [],
          cantidad: 0,
          valorTotal: 0,
          valorUnitario: 0,
        },
        total: {
          cantidad: 0,
          valorTotal: 0,
        },
      }
    }

    if (genero === "machos" || genero === "hembras") {
      // Usar ticket2 si está disponible, de lo contrario usar ticket
      const ticketNum = ticket.ticket2 || ticket.ticket || 0
      if (ticketNum) {
        agrupados[periodoKey][genero].tickets.push(Number.parseInt(ticketNum))
        console.log(`Añadido ticket ${ticketNum} a ${genero} para periodo ${periodoKey}`)
      }

      agrupados[periodoKey][genero].cantidad += 1
      agrupados[periodoKey][genero].valorTotal += Number(ticket.valor || 0)

      // Actualizar el total
      agrupados[periodoKey].total.cantidad += 1
      agrupados[periodoKey].total.valorTotal += Number(ticket.valor || 0)
    }
  })

  // Calcular valor unitario promedio y ordenar tickets
  Object.values(agrupados).forEach((periodo) => {
    periodo.machos.valorUnitario = periodo.machos.cantidad > 0 ? periodo.machos.valorTotal / periodo.machos.cantidad : 0
    periodo.hembras.valorUnitario =
      periodo.hembras.cantidad > 0 ? periodo.hembras.valorTotal / periodo.hembras.cantidad : 0

    // Ordenar tickets y crear rango
    periodo.machos.tickets.sort((a, b) => a - b)
    periodo.hembras.tickets.sort((a, b) => a - b)

    // Imprimir para depuración
    console.log(`Periodo ${periodo.periodoKey}: Machos tickets=${periodo.machos.tickets.join(",")}`)
    console.log(`Periodo ${periodo.periodoKey}: Hembras tickets=${periodo.hembras.tickets.join(",")}`)

    periodo.machos.ticketsRango =
      periodo.machos.tickets.length > 0
        ? `${periodo.machos.tickets[0]} - ${periodo.machos.tickets[periodo.machos.tickets.length - 1]}`
        : ""

    periodo.hembras.ticketsRango =
      periodo.hembras.tickets.length > 0
        ? `${periodo.hembras.tickets[0]} - ${periodo.hembras.tickets[periodo.hembras.tickets.length - 1]}`
        : ""
  })

  // Convertir a array y ordenar por periodo
  const resultado = Object.values(agrupados).sort((a, b) => {
    return a.periodoKey.localeCompare(b.periodoKey)
  })

  console.log(`Periodos agrupados: ${resultado.length}`)
  return resultado
}

// Función para formatear moneda
function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
