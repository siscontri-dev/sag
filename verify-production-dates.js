import { sql } from "@vercel/postgres"

async function verifyProductionDates() {
  try {
    console.log("Verificando fechas en la base de datos de producción...")

    // Consultar algunas transacciones recientes
    const result = await sql`
      SELECT 
        id, 
        fecha_documento, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formateada,
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_con_timezone,
        type,
        business_location_id
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 10
    `

    // Mostrar los resultados
    console.log("Resultados de la consulta:")
    result.rows.forEach((row) => {
      console.log(`ID: ${row.id}`)
      console.log(`Fecha original: ${row.fecha_documento}`)
      console.log(`Fecha formateada sin timezone: ${row.fecha_formateada}`)
      console.log(`Fecha formateada con timezone: ${row.fecha_con_timezone}`)
      console.log(`Tipo: ${row.type}`)
      console.log(`Location ID: ${row.business_location_id}`)
      console.log("-------------------")
    })

    // Verificar la configuración de zona horaria de la base de datos
    const timezoneResult = await sql`SHOW timezone`
    console.log(`Zona horaria de la base de datos: ${timezoneResult.rows[0].timezone}`)

    // Verificar la fecha y hora actual según la base de datos
    const currentTimeResult = await sql`SELECT NOW() as current_time`
    console.log(`Fecha y hora actual en la base de datos: ${currentTimeResult.rows[0].current_time}`)
  } catch (error) {
    console.error("Error al verificar fechas:", error)
  }
}

// Ejecutar la función
verifyProductionDates()
