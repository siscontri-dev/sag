const { sql } = require("@vercel/postgres")

async function main() {
  try {
    console.log("=== VERIFICACIÓN DETALLADA DE FECHAS ===")

    // Obtener la configuración de zona horaria de PostgreSQL
    const timezoneResult = await sql`SHOW timezone`
    console.log("Zona horaria de PostgreSQL:", timezoneResult.rows[0].timezone)

    // Obtener la fecha y hora actual del servidor
    const currentTimeResult = await sql`SELECT NOW() as now`
    console.log("Fecha y hora actual del servidor:", currentTimeResult.rows[0].now)

    // Obtener algunas transacciones para analizar en detalle
    const transactionsResult = await sql`
      SELECT 
        id,
        numero_documento,
        fecha_documento,
        fecha_documento::text as fecha_raw,
        business_location_id,
        type
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 10
    `

    console.log("\n=== ANÁLISIS DETALLADO DE FECHAS ===")
    for (const tx of transactionsResult.rows) {
      console.log(`\nTransacción ID: ${tx.id}, Número: ${tx.numero_documento}`)
      console.log(`  Tipo: ${tx.type}, Location ID: ${tx.business_location_id}`)
      console.log(`  Fecha original (objeto): ${tx.fecha_documento}`)
      console.log(`  Fecha raw (texto): ${tx.fecha_raw}`)

      // Probar diferentes formatos de fecha
      const formats = [
        { name: "Sin zona horaria", query: `TO_CHAR(fecha_documento, 'YYYY-MM-DD')` },
        { name: "Con zona UTC", query: `TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'YYYY-MM-DD')` },
        { name: "Con zona Bogotá", query: `TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD')` },
        { name: "Día del mes", query: `EXTRACT(DAY FROM fecha_documento)` },
        { name: "Día del mes (UTC)", query: `EXTRACT(DAY FROM fecha_documento AT TIME ZONE 'UTC')` },
        { name: "Día del mes (Bogotá)", query: `EXTRACT(DAY FROM fecha_documento AT TIME ZONE 'America/Bogota')` },
      ]

      for (const format of formats) {
        const result = await sql.query(
          `
          SELECT ${format.query} as formatted_date
          FROM transactions
          WHERE id = $1
        `,
          [tx.id],
        )

        console.log(`  ${format.name}: ${result.rows[0].formatted_date}`)
      }
    }

    // Verificar si hay diferencia de un día entre formatos
    console.log("\n=== VERIFICACIÓN DE DIFERENCIA DE DÍAS ===")
    const diffCheckResult = await sql`
      SELECT 
        id,
        numero_documento,
        EXTRACT(DAY FROM fecha_documento) as day_original,
        EXTRACT(DAY FROM fecha_documento AT TIME ZONE 'UTC') as day_utc,
        EXTRACT(DAY FROM fecha_documento AT TIME ZONE 'America/Bogota') as day_bogota
      FROM 
        transactions
      WHERE 
        activo = TRUE
        AND EXTRACT(DAY FROM fecha_documento) <> EXTRACT(DAY FROM fecha_documento AT TIME ZONE 'America/Bogota')
      LIMIT 10
    `

    if (diffCheckResult.rows.length > 0) {
      console.log("¡ALERTA! Se encontraron transacciones con diferencia de días:")
      diffCheckResult.rows.forEach((row) => {
        console.log(`  ID: ${row.id}, Número: ${row.numero_documento}`)
        console.log(`    Día original: ${row.day_original}, Día UTC: ${row.day_utc}, Día Bogotá: ${row.day_bogota}`)
      })
    } else {
      console.log("No se encontraron transacciones con diferencia de días entre formatos.")
    }

    console.log("\n=== VERIFICACIÓN COMPLETADA ===")
  } catch (error) {
    console.error("Error durante la verificación:", error)
  } finally {
    process.exit(0)
  }
}

main()
