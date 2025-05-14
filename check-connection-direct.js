// Reemplazar este archivo por una versión que use @vercel/postgres
import { sql } from "@vercel/postgres"

async function checkConnectionDirect() {
  try {
    console.log("Intentando conectar directamente a la base de datos...")

    const result = await sql`SELECT NOW() as current_time`

    console.log("Conexión exitosa!")
    console.log("Hora actual del servidor:", result.rows[0].current_time)

    return {
      success: true,
      message: "Conexión exitosa",
      time: result.rows[0].current_time,
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
  checkConnectionDirect()
    .then((result) => {
      console.log("Resultado:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Error no controlado:", error)
      process.exit(1)
    })
}

export default checkConnectionDirect
