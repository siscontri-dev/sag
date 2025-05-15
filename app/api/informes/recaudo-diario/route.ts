import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get("fechaInicio")
    const fechaFin = searchParams.get("fechaFin")
    const busqueda = searchParams.get("busqueda")

    // Construir la consulta SQL con filtros opcionales
    let query = `
      SELECT
          t.fecha_documento::date AS "Fecha",
          MIN(tl.id) AS "Del",
          MAX(tl.id) AS "Al",
          COUNT(tl.id) AS "Tiquetes",
          SUM(t.quantity_m) AS "Machos",
          SUM(t.quantity_h) AS "Hembras",
          SUM(t.quantity_k) AS "Peso",
          SUM(tl.valor) / NULLIF(COUNT(tl.id), 0) AS "ValorUnitario",
          SUM(tl.valor) AS "TotalValor"
      FROM
          transactions t
      JOIN
          transaction_lines tl ON tl.transaction_id = t.id
      WHERE
          t.type = 'entry'
          AND t.business_location_id = 2
    `

    // Agregar filtros de fecha si están presentes
    const params: any[] = []
    let paramIndex = 1

    if (fechaInicio && fechaFin) {
      query += ` AND t.fecha_documento::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      params.push(fechaInicio, fechaFin)
      paramIndex += 2
    }

    // Agregar filtro de búsqueda si está presente
    if (busqueda) {
      query += ` AND (
        CAST(tl.id AS TEXT) ILIKE $${paramIndex} OR
        CAST(t.quantity_m AS TEXT) ILIKE $${paramIndex} OR
        CAST(t.quantity_h AS TEXT) ILIKE $${paramIndex} OR
        CAST(t.quantity_k AS TEXT) ILIKE $${paramIndex}
      )`
      params.push(`%${busqueda}%`)
      paramIndex += 1
    }

    // Agregar agrupación y ordenamiento
    query += `
      GROUP BY
          t.fecha_documento::date
      ORDER BY
          t.fecha_documento::date DESC
    `

    // Ejecutar la consulta
    const result = await sql.query(query, params)

    // Devolver los resultados
    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error("Error al obtener datos de recaudo diario:", error)
    return NextResponse.json({ error: "Error al obtener datos de recaudo diario" }, { status: 500 })
  }
}
