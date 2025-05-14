import { sql } from "@vercel/postgres"

async function fixProductionDates() {
  try {
    console.log("Verificando la configuración de zona horaria de la base de datos...")

    // Verificar la configuración actual
    const currentTimezoneResult = await sql`SHOW timezone`
    console.log(`Zona horaria actual: ${currentTimezoneResult.rows[0].timezone}`)

    // Establecer la zona horaria a 'America/Bogota'
    console.log("Estableciendo zona horaria a 'America/Bogota'...")
    await sql`SET timezone = 'America/Bogota'`

    // Verificar que se haya aplicado el cambio
    const newTimezoneResult = await sql`SHOW timezone`
    console.log(`Nueva zona horaria: ${newTimezoneResult.rows[0].timezone}`)

    console.log("Cambio de zona horaria completado.")
  } catch (error) {
    console.error("Error al corregir fechas:", error)
  }
}

// Ejecutar la función
fixProductionDates()
