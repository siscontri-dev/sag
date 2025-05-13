import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"

// Verificar la disponibilidad de variables de entorno
const hasConnectionString = !!process.env.POSTGRES_URL || !!process.env.DATABASE_URL
if (!hasConnectionString) {
  console.error("ADVERTENCIA: No se encontró la variable de entorno POSTGRES_URL o DATABASE_URL")
}

// Configuración para manejar errores de conexión
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 300 // ms

export { sql }

// Función para ejecutar consultas con reintentos y mejor manejo de errores
export const db = {
  query: async (query: string, values: any[] = []) => {
    noStore() // Evitar el almacenamiento en caché

    let lastError = null

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Usar directamente sql.query para evitar problemas con WebSockets
        const result = await sql.query(query, values)
        return result.rows
      } catch (error) {
        lastError = error

        // Registrar el error con detalles
        console.error(`Error en consulta (intento ${attempt}/${MAX_RETRIES}):`, error)

        // Si es el último intento, no esperar más
        if (attempt === MAX_RETRIES) break

        // Esperar con backoff exponencial antes de reintentar
        const backoff = INITIAL_BACKOFF * Math.pow(2, attempt - 1)
        console.log(`Reintentando en ${backoff}ms...`)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.error(`Error después de ${MAX_RETRIES} intentos. Último error:`, lastError)

    // Devolver un array vacío en lugar de lanzar un error
    // Esto permite que la aplicación siga funcionando aunque haya errores de conexión
    return []
  },
}
