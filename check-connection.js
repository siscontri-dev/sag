import { sql } from "@vercel/postgres"

async function checkConnection() {
  try {
    console.log("Intentando conectar a la base de datos con @vercel/postgres...")

    // Prueba simple de conexión
    const result = await sql`SELECT NOW() as current_time`

    console.log("✅ Conexión exitosa a la base de datos Neon")
    console.log(`Hora actual del servidor: ${result.rows[0].current_time}`)

    // Verificar tablas existentes
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log("\nTablas encontradas en la base de datos:")
    if (tablesResult.rows.length === 0) {
      console.log("No se encontraron tablas. Es posible que necesites crear la estructura de la base de datos.")
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`- ${row.table_name}`)
      })
      console.log(`\nTotal: ${tablesResult.rows.length} tablas`)
    }
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error)
  }
}

checkConnection()
