import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import ExcelJS from "exceljs"

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

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Tickets")

    // Definir las columnas
    worksheet.columns = [
      { header: "Nº Ticket", key: "ticket2", width: 12 },
      { header: "Nº Guía", key: "numero_guia", width: 12 },
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Propietario", key: "propietario", width: 30 },
      { header: "NIT", key: "nit", width: 15 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Raza", key: "raza", width: 15 },
      { header: "Color", key: "color", width: 15 },
      { header: "Género", key: "genero", width: 10 },
      { header: "Kilos", key: "kilos", width: 10 },
      { header: "Valor", key: "valor", width: 12 },
      { header: "Estado", key: "estado", width: 10 },
    ]

    // Dar formato a la cabecera
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }

    // Añadir los datos
    tickets.forEach((ticket) => {
      const row = {
        ...ticket,
        fecha: ticket.fecha ? new Date(ticket.fecha).toLocaleDateString("es-CO") : "",
        kilos: ticket.kilos || 0,
        valor: ticket.valor || 0,
      }
      worksheet.addRow(row)
    })

    // Dar formato a las columnas numéricas
    worksheet.getColumn("kilos").numFmt = "#,##0"
    worksheet.getColumn("valor").numFmt = "#,##0"

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer()

    // Devolver la respuesta
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="tickets_${tipo || "todos"}_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar tickets a Excel:", error)
    return NextResponse.json({ error: "Error al exportar tickets a Excel" }, { status: 500 })
  }
}
