import { sql } from "@vercel/postgres"

async function checkDbConnectionDirect() {
  try {
    console.log("Intentando conectar directamente a la base de datos...")

    const result = await sql`SELECT NOW() as current_time`

    console.log("Conexión exitosa!")
    console.log("Hora actual del servidor:", result.rows[0].current_time)

    // Intentar una consulta similar a la del informe
    console.log("Intentando ejecutar una consulta similar a la del informe...")

    const testQuery = await sql`
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
    `

    console.log("Consulta de prueba exitosa:", testQuery.rows[0])

    return {
      success: true,
      message: "Conexión exitosa",
      time: result.rows[0].current_time,
      testQuery: testQuery.rows[0],
    }
  } catch (error) {
    console.error("Error al conectar directamente a la base de datos:", error)
    return {
      success: false,
      message: "Error al conectar",
      error: error.message,
    }
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  checkDbConnectionDirect()
    .then((result) => {
      console.log("Resultado:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

export default checkDbConnectionDirect
