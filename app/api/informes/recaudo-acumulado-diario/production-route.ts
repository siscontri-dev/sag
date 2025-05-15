import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"
import { formatDateForSQL } from "@/lib/date-utils"
import { sampleData, sampleTotals } from "./sample-data"

export async function GET(request: Request) {
  try {
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    // Preparar los parámetros para la consulta
    const params = []
    let paramIndex = 1

    // Construir la consulta base
    let queryText = `
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
        AND t.business_location_id = 1
    `

    // Agregar filtros de fecha si están presentes
    if (startDate && endDate) {
      queryText += ` AND t.fecha_documento::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      params.push(formatDateForSQL(startDate), formatDateForSQL(endDate))
      paramIndex += 2
    }

    // Agregar filtro de búsqueda si está presente
    if (search) {
      queryText += ` AND (CAST(tl.id AS TEXT) ILIKE $${paramIndex} OR CAST(t.fecha_documento AS TEXT) ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex += 1
    }

    // Agrupar y ordenar
    queryText += `
      GROUP BY
        t.fecha_documento::date
      ORDER BY
        t.fecha_documento::date DESC
    `

    // Ejecutar la consulta usando sql de @vercel/postgres
    const result = await sql.query(queryText, params)

    // Calcular totales para el pie de la tabla
    const totals = {
      Fecha: "TOTALES",
      "Del (Primer Ticket ID)": "",
      "Al (Último Ticket ID)": "",
      Tiquetes: result.rows.reduce((sum, row) => sum + Number.parseInt(row["Tiquetes"] as string), 0),
      "Nº Machos": result.rows
        .reduce((sum, row) => {
          const value = (row["Nº Machos"] as string)?.replace(/,/g, "") || "0"
          return sum + Number.parseInt(value)
        }, 0)
        .toLocaleString(),
      "Nº Hembras": result.rows
        .reduce((sum, row) => {
          const value = (row["Nº Hembras"] as string)?.replace(/,/g, "") || "0"
          return sum + Number.parseInt(value)
        }, 0)
        .toLocaleString(),
      "Peso (Kg)": result.rows
        .reduce((sum, row) => {
          const value = (row["Peso (Kg)"] as string)?.replace(/,/g, "") || "0"
          return sum + Number.parseInt(value)
        }, 0)
        .toLocaleString(),
      "Valor Servicio Unitario": "",
      "Total Valor Servicio": result.rows
        .reduce((sum, row) => {
          const value = (row["Total Valor Servicio"] as string)?.replace(/,/g, "") || "0"
          return sum + Number.parseInt(value)
        }, 0)
        .toLocaleString(),
    }

    return NextResponse.json({
      data: result.rows,
      totals: totals,
      usingSampleData: false,
    })
  } catch (error) {
    console.error("Error al obtener datos de recaudo acumulado diario:", error)

    // Si hay un error, devolver datos de ejemplo
    console.warn("Devolviendo datos de ejemplo debido a un error")

    return NextResponse.json({
      data: sampleData,
      totals: sampleTotals,
      usingSampleData: true,
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
