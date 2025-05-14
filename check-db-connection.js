// Reemplazar este archivo por una versión que use @vercel/postgres
import { sql } from "@vercel/postgres"

async function checkDbConnection() {
  try {
    console.log("Verificando conexión a la base de datos...")

    const result = await sql`SELECT NOW() as current_time, current_setting('timezone') as timezone`

    console.log("Conexión exitosa!")
    console.log("Hora actual del servidor:", result.rows[0].current_time)
    console.log("Zona horaria de la base de datos:", result.rows[0].timezone)

    return {
      success: true,
      message: "Conexión exitosa",
      time: result.rows[0].current_time,
      timezone: result.rows[0].timezone,
    }
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error)
    return {
      success: false,
      message: "Error al conectar",
      error: error.message,
    }
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  checkDbConnection()
    .then((result) => {
      console.log("Resultado:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

export default checkDbConnection
