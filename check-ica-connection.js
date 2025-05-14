const { sql } = require("@vercel/postgres")

async function checkConnection() {
  try {
    console.log("Intentando conectar a la base de datos...")
    const result = await sql.query("SELECT NOW() as time")
    console.log("Conexión exitosa:", result.rows[0])

    // Probar una consulta simple similar a la que necesitamos
    console.log("Probando consulta simple...")
    const testQuery = await sql.query(
      `
      SELECT COUNT(*) FROM transactions 
      WHERE business_location_id = $1
    `,
      [1],
    )
    console.log("Resultado de consulta simple:", testQuery.rows[0])
  } catch (error) {
    console.error("Error al conectar:", error)
  }
}

checkConnection()
