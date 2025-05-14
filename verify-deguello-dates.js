// Script para verificar las fechas de degüello en la base de datos
import { sql } from "@vercel/postgres"

async function verifyDeguellosDates() {
  try {
    console.log("Verificando fechas de degüellos en la base de datos...")

    // Verificar fechas de degüellos de bovinos
    const bovinosResult = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formateada,
        business_location_id,
        type
      FROM 
        transactions 
      WHERE 
        business_location_id = 1 
        AND type = 'exit' 
        AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 20
    `

    console.log("Fechas de degüellos de bovinos:")
    bovinosResult.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Guía: ${row.numero_documento}, Fecha: ${row.fecha_documento}, Formateada: ${row.fecha_formateada}`,
      )
    })

    // Verificar fechas de degüellos de porcinos
    const porcinosResult = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formateada,
        business_location_id,
        type
      FROM 
        transactions 
      WHERE 
        business_location_id = 2 
        AND type = 'exit' 
        AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 20
    `

    console.log("\nFechas de degüellos de porcinos:")
    porcinosResult.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Guía: ${row.numero_documento}, Fecha: ${row.fecha_documento}, Formateada: ${row.fecha_formateada}`,
      )
    })

    // Verificar la configuración de zona horaria de la base de datos
    const timezoneResult = await sql`SHOW timezone`
    console.log("\nZona horaria de la base de datos:", timezoneResult.rows[0].timezone)

    // Verificar la fecha actual según la base de datos
    const currentDateResult = await sql`SELECT NOW(), TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI:SS') as fecha_actual`
    console.log("Fecha actual según la base de datos:", currentDateResult.rows[0].now)
    console.log("Fecha actual formateada:", currentDateResult.rows[0].fecha_actual)
  } catch (error) {
    console.error("Error al verificar fechas de degüellos:", error)
  }
}

verifyDeguellosDates()
