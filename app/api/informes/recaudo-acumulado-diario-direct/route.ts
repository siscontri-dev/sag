import { NextResponse } from "next/server"
import { Pool } from "pg"
import { formatDateForSQL } from "@/lib/date-utils"
import { sampleData, sampleTotals } from "../recaudo-acumulado-diario/sample-data"

export async function GET(request: Request) {
  try {
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const startDate = searchParams.get("startDate") || ""
    const endDate = searchParams.get("endDate") || ""

    // Obtener la cadena de conexión
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      console.error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
      throw new Error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    }

    // Crear un pool de conexiones
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    // Obtener un cliente del pool
    const client = await pool.connect()
    console.log("Conexión directa establecida correctamente")

    try {
      // Construir la consulta
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

      // Construir la consulta con parámetros
      const params = []

      // Agregar filtros de fecha si están presentes
      if (startDate && endDate) {
        queryText += ` AND t.fecha_documento::date BETWEEN $1 AND $2`
        params.push(formatDateForSQL(startDate), formatDateForSQL(endDate))
      }

      // Agregar filtro de búsqueda si está presente
      if (search) {
        const searchParam = `%${search}%`
        if (params.length === 0) {
          queryText += ` AND (CAST(tl.id AS TEXT) ILIKE $1 OR CAST(t.fecha_documento AS TEXT) ILIKE $1)`
          params.push(searchParam)
        } else {
          queryText += ` AND (CAST(tl.id AS TEXT) ILIKE $3 OR CAST(t.fecha_documento AS TEXT) ILIKE $3)`
          params.push(searchParam)
        }
      }

      // Agrupar y ordenar
      queryText += `
        GROUP BY
          t.fecha_documento::date
        ORDER BY
          t.fecha_documento::date DESC
      `

      // Ejecutar la consulta
      console.log("Ejecutando consulta directa:", queryText)
      console.log("Parámetros:", params)

      const result = await client.query(queryText, params)
      console.log(`Consulta directa ejecutada correctamente. Se encontraron ${result.rows.length} registros.`)

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
    } finally {
      // Liberar el cliente
      client.release()

      // Cerrar el pool
      await pool.end()
    }
  } catch (error) {
    console.error("Error al obtener datos de recaudo acumulado diario (conexión directa):", error)

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
