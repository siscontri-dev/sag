const { Pool } = require("pg")

async function checkDirectConnection() {
  console.log("Verificando conexión directa a PostgreSQL...")

  // Obtener la cadena de conexión
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    return {
      success: false,
      message: "No se encontró la variable de entorno de conexión",
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
    // Intentar ejecutar una consulta simple
    console.log("Intentando ejecutar una consulta simple...")
    const result = await pool.query("SELECT NOW() as time")

    console.log("Conexión exitosa!")
    console.log("Hora del servidor:", result.rows[0].time)

    // Intentar ejecutar la consulta específica
    console.log("\nIntentando ejecutar la consulta de recaudo acumulado diario...")

    const queryResult = await pool.query(`
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
      LIMIT 1
    `)

    if (queryResult.rows.length > 0) {
      console.log("Consulta específica exitosa!")
      console.log("Primer resultado:", queryResult.rows[0])
    } else {
      console.log("Consulta específica exitosa, pero no se encontraron resultados.")
    }

    return {
      success: true,
      message: "Conexión directa exitosa",
      time: result.rows[0].time,
      queryResult: queryResult.rows.length > 0 ? queryResult.rows[0] : null,
    }
  } catch (error) {
    console.error("Error al conectar directamente a PostgreSQL:", error)
    return {
      success: false,
      message: "Error al conectar",
      error: error.message,
    }
  } finally {
    // Cerrar el pool
    await pool.end()
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  checkDirectConnection()
    .then((result) => {
      console.log("\nResultado final:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

module.exports = checkDirectConnection
