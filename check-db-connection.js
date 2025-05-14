const { sql } = require("@vercel/postgres")

async function checkConnection() {
  try {
    console.log("Intentando conectar a la base de datos...")

    // Intentar una consulta simple
    const result = await sql`SELECT NOW() as time`

    console.log("Conexión exitosa!")
    console.log("Hora del servidor:", result.rows[0].time)

    // Intentar una consulta similar a la que necesitamos
    console.log("\nProbando consulta similar a la necesaria...")
    const testQuery = await sql`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE type = 'entry'
    `

    console.log("Consulta exitosa!")
    console.log("Número de transacciones:", testQuery.rows[0].count)

    return { success: true, message: "Conexión y consultas exitosas" }
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error)
    return {
      success: false,
      message: "Error de conexión",
      error: error.message,
      stack: error.stack,
    }
  }
}

// Ejecutar la función
checkConnection()
  .then((result) => {
    if (!result.success) {
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error("Error inesperado:", err)
    process.exit(1)
  })
