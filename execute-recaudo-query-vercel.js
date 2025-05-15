const { sql } = require("@vercel/postgres")

async function executeRecaudoQueryVercel() {
  try {
    console.log("Intentando conectar a la base de datos usando @vercel/postgres...")

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

    console.log("Ejecutando consulta...")
    const result = await sql.query(query)
    console.log("Consulta ejecutada correctamente")

    // Mostrar los resultados
    console.log(`Se encontraron ${result.rows.length} registros:`)
    console.table(result.rows)

    return {
      success: true,
      message: "Consulta ejecutada correctamente",
      rowCount: result.rows.length,
      rows: result.rows,
    }
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error)

    return {
      success: false,
      message: "Error al ejecutar la consulta",
      error: error.message,
      stack: error.stack,
    }
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  executeRecaudoQueryVercel()
    .then((result) => {
      if (result.success) {
        console.log("Resultado exitoso:", result.message)
        console.log(`Se encontraron ${result.rowCount} registros`)
      } else {
        console.error("Error:", result.message)
        if (result.error) {
          console.error("Detalles del error:", result.error)
        }
      }
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

module.exports = executeRecaudoQueryVercel
