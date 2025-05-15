const { Pool } = require("pg")

async function executeRecaudoQuery() {
  // Obtener la cadena de conexión de la variable de entorno
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    return {
      success: false,
      message: "No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL",
    }
  }

  // Crear un pool de conexiones
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log("Intentando conectar a la base de datos...")

    // Probar la conexión
    const client = await pool.connect()
    console.log("Conexión establecida correctamente")

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
    const result = await client.query(query)
    console.log("Consulta ejecutada correctamente")

    // Mostrar los resultados
    console.log(`Se encontraron ${result.rows.length} registros:`)
    console.table(result.rows)

    // Liberar el cliente
    client.release()

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
  } finally {
    // Cerrar el pool
    await pool.end()
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  executeRecaudoQuery()
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

module.exports = executeRecaudoQuery
