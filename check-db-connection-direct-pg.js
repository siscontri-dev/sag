const { Pool } = require("pg")

async function checkDbConnectionDirectPg() {
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
    console.log("Intentando conectar directamente a la base de datos usando pg...")

    // Probar la conexión
    const client = await pool.connect()

    // Ejecutar una consulta simple
    const result = await client.query("SELECT NOW() as current_time")

    console.log("Conexión exitosa!")
    console.log("Hora actual del servidor:", result.rows[0].current_time)

    // Intentar una consulta similar a la del informe
    console.log("Intentando ejecutar una consulta similar a la del informe...")

    const testQuery = await client.query(`
      SELECT
        NOW()::date AS "Fecha",
        1 AS "Del (Primer Ticket ID)",
        10 AS "Al (Último Ticket ID)",    
        10 AS "Tiquetes",
        TO_CHAR(100, 'FM999,999') AS "Nº Machos",
        TO_CHAR(50, 'FM999,999') AS "Nº Hembras",
        TO_CHAR(1000, 'FM999,999') AS "Peso (Kg)",
        TO_CHAR(1000 / 10, 'FM999,999') AS "Valor Servicio Unitario",
        TO_CHAR(1000, 'FM999,999,999') AS "Total Valor Servicio"
    `)

    console.log("Consulta de prueba exitosa:", testQuery.rows[0])

    // Liberar el cliente
    client.release()

    return {
      success: true,
      message: "Conexión exitosa",
      time: result.rows[0].current_time,
      testQuery: testQuery.rows[0],
    }
  } catch (error) {
    console.error("Error al conectar directamente a la base de datos usando pg:", error)

    return {
      success: false,
      message: "Error al conectar",
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
  checkDbConnectionDirectPg()
    .then((result) => {
      console.log("Resultado:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

module.exports = checkDbConnectionDirectPg
