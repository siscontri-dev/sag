import { sql } from "@vercel/postgres"

async function updateDatabaseTimezone() {
  try {
    console.log("Actualizando la configuración de zona horaria en la base de datos...")

    // Verificar la configuración actual
    const currentTimezoneResult = await sql`SHOW timezone`
    console.log(`Zona horaria actual: ${currentTimezoneResult.rows[0].timezone}`)

    // Establecer la zona horaria a 'America/Bogota' de forma permanente
    console.log("Estableciendo zona horaria a 'America/Bogota' de forma permanente...")

    // Esto requiere permisos de administrador en la base de datos
    try {
      await sql`ALTER DATABASE CURRENT_DATABASE() SET timezone = 'America/Bogota'`
      console.log("✅ Zona horaria de la base de datos actualizada correctamente.")
    } catch (error) {
      console.error("❌ No se pudo actualizar la zona horaria de la base de datos:", error.message)
      console.log("Esto puede requerir permisos de administrador.")
    }

    // Establecer la zona horaria para la sesión actual
    await sql`SET timezone = 'America/Bogota'`

    // Verificar que se haya aplicado el cambio
    const newTimezoneResult = await sql`SHOW timezone`
    console.log(`Nueva zona horaria para la sesión actual: ${newTimezoneResult.rows[0].timezone}`)

    // Verificar la fecha y hora actual según la base de datos
    const currentTimeResult = await sql`SELECT NOW() as current_time`
    console.log(`Fecha y hora actual en la base de datos: ${currentTimeResult.rows[0].current_time}`)
  } catch (error) {
    console.error("Error al actualizar la zona horaria:", error)
  }
}

// Ejecutar la función
updateDatabaseTimezone()
