import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import ExcelJS from "exceljs"

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
      console.log(`Excel - Rango de fechas obtenido: ${minFecha.toISOString()} a ${maxFecha.toISOString()}`)
      console.log(`Excel - Total de tickets obtenidos: ${tickets.length}`)
    }

    // Procesar los datos para agruparlos
    const ticketsAgrupados = agruparTickets(tickets, agrupacion)

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(`Tickets Agrupados por ${agrupacion === "dia" ? "Día" : "Mes"}`)

    // Definir las columnas
    worksheet.columns = [
      { header: agrupacion === "dia" ? "Fecha" : "Mes", key: "periodo", width: 20 },

      // Machos
      { header: "Tickets (Machos)", key: "machos_tickets", width: 20 },
      { header: "Cantidad (Machos)", key: "machos_cantidad", width: 15 },
      { header: "Valor Unitario (Machos)", key: "machos_valor_unitario", width: 20 },
      { header: "Valor Total (Machos)", key: "machos_valor_total", width: 20 },

      // Hembras
      { header: "Tickets (Hembras)", key: "hembras_tickets", width: 20 },
      { header: "Cantidad (Hembras)", key: "hembras_cantidad", width: 15 },
      { header: "Valor Unitario (Hembras)", key: "hembras_valor_unitario", width: 20 },
      { header: "Valor Total (Hembras)", key: "hembras_valor_total", width: 20 },

      // Totales
      { header: "Cantidad Total", key: "total_cantidad", width: 15 },
      { header: "Valor Total", key: "total_valor", width: 20 },
    ]

    // Dar formato a la cabecera
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }

    // Añadir los datos
    ticketsAgrupados.forEach((item) => {
      worksheet.addRow({
        periodo: item.periodo,

        // Machos
        machos_tickets: item.machos.ticketsRango,
        machos_cantidad: item.machos.cantidad,
        machos_valor_unitario: item.machos.valorUnitario,
        machos_valor_total: item.machos.valorTotal,

        // Hembras
        hembras_tickets: item.hembras.ticketsRango,
        hembras_cantidad: item.hembras.cantidad,
        hembras_valor_unitario: item.hembras.valorUnitario,
        hembras_valor_total: item.hembras.valorTotal,

        // Totales
        total_cantidad: item.total.cantidad,
        total_valor: item.total.valorTotal,
      })
    })

    // Añadir fila de totales
    const totalRow = worksheet.addRow({
      periodo: "TOTALES",

      // Machos
      machos_tickets: "",
      machos_cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.machos.cantidad, 0),
      machos_valor_unitario:
        ticketsAgrupados.reduce((sum, item) => sum + item.machos.valorTotal, 0) /
          ticketsAgrupados.reduce((sum, item) => sum + item.machos.cantidad, 0) || 0,
      machos_valor_total: ticketsAgrupados.reduce((sum, item) => sum + item.machos.valorTotal, 0),

      // Hembras
      hembras_tickets: "",
      hembras_cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.cantidad, 0),
      hembras_valor_unitario:
        ticketsAgrupados.reduce((sum, item) => sum + item.hembras.valorTotal, 0) /
          ticketsAgrupados.reduce((sum, item) => sum + item.hembras.cantidad, 0) || 0,
      hembras_valor_total: ticketsAgrupados.reduce((sum, item) => sum + item.hembras.valorTotal, 0),

      // Totales
      total_cantidad: ticketsAgrupados.reduce((sum, item) => sum + item.total.cantidad, 0),
      total_valor: ticketsAgrupados.reduce((sum, item) => sum + item.total.valorTotal, 0),
    })

    totalRow.font = { bold: true }
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" },
    }

    // Dar formato a las columnas numéricas
    worksheet.getColumn("machos_cantidad").numFmt = "#,##0"
    worksheet.getColumn("machos_valor_unitario").numFmt = "#,##0.00"
    worksheet.getColumn("machos_valor_total").numFmt = "#,##0.00"
    worksheet.getColumn("hembras_cantidad").numFmt = "#,##0"
    worksheet.getColumn("hembras_valor_unitario").numFmt = "#,##0.00"
    worksheet.getColumn("hembras_valor_total").numFmt = "#,##0.00"
    worksheet.getColumn("total_cantidad").numFmt = "#,##0"
    worksheet.getColumn("total_valor").numFmt = "#,##0.00"

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer()

    // Devolver la respuesta
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tickets_agrupados_${agrupacion}_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar tickets agrupados a Excel:", error)
    return NextResponse.json({ error: "Error al exportar tickets agrupados a Excel" }, { status: 500 })
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
