import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Ejecutando consulta de prueba...")

    // La consulta SQL proporcionada
    const query = `
      SELECT
          t.fecha_documento::date AS "Fecha",

          MIN(tl.id) AS "Del (Primer Ticket ID)",
          MAX(tl.id) AS "Al (Último Ticket ID)",
          
          COUNT(tl.id) AS "Tiquetes",

          TO_CHAR(SUM(t.quantity_m), 'FM999,999') AS "Nº Machos",
          TO_CHAR(SUM(t.quantity_h), 'FM999,999') AS "Nº Hembras",
          TO_CHAR(SUM(t.quantity_k), 'FM999,999') AS "Peso (Kg)",

          TO_CHAR(SUM(tl.valor) / NULLIF(COUNT(tl.id), 0), 'FM999,999') AS "Valor Servicio Unitario",
          TO_CHAR(SUM(tl.valor), 'FM999,999,999') AS "Total Valor Servicio"

      FROM
          transactions t
      JOIN
          transaction_lines tl ON tl.transaction_id = t.id
      WHERE
          t.type = 'entry'
          AND t.business_location_id = 2
      GROUP BY
          t.fecha_documento::date
      ORDER BY
          t.fecha_documento::date DESC
      LIMIT 10
    `

    const result = await sql.query(query)
    console.log(`Consulta ejecutada correctamente. Se encontraron ${result.rows.length} registros.`)

    return NextResponse.json({
      success: true,
      message: "Consulta ejecutada correctamente",
      rowCount: result.rows.length,
      rows: result.rows,
    })
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error al ejecutar la consulta",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
