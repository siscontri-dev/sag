// Script para corregir las fechas de degüello en la base de datos
import { sql } from "@vercel/postgres"

async function fixDeguellosDates() {
  try {
    console.log("Corrigiendo fechas de degüellos en la base de datos...")

    // Verificar si hay fechas con problemas (fechas que no están en la zona horaria correcta)
    const problematicDatesResult = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formateada
      FROM 
        transactions 
      WHERE 
        type = 'exit' 
        AND activo = TRUE
        AND (
          EXTRACT(HOUR FROM fecha_documento) != 0 
          OR EXTRACT(MINUTE FROM fecha_documento) != 0 
          OR EXTRACT(SECOND FROM fecha_documento) != 0
        )
      ORDER BY 
        fecha_documento DESC
    `

    console.log(`Se encontraron ${problematicDatesResult.rows.length} registros con fechas problemáticas.`)

    if (problematicDatesResult.rows.length > 0) {
      console.log("Ejemplos de fechas problemáticas:")
      problematicDatesResult.rows.slice(0, 5).forEach((row) => {
        console.log(
          `ID: ${row.id}, Guía: ${row.numero_documento}, Fecha: ${row.fecha_documento}, Formateada: ${row.fecha_formateada}`,
        )
      })

      // Corregir las fechas problemáticas (establecer la hora a 00:00:00)
      const updateResult = await sql`
        UPDATE transactions
        SET fecha_documento = DATE_TRUNC('day', fecha_documento)
        WHERE 
          type = 'exit' 
          AND activo = TRUE
          AND (
            EXTRACT(HOUR FROM fecha_documento) != 0 
            OR EXTRACT(MINUTE FROM fecha_documento) != 0 
            OR EXTRACT(SECOND FROM fecha_documento) != 0
          )
      `

      console.log(`Se corrigieron ${updateResult.rowCount} registros.`)
    } else {
      console.log("No se encontraron fechas problemáticas.")
    }

    // Verificar las fechas después de la corrección
    const afterFixResult = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento, 
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formateada
      FROM 
        transactions 
      WHERE 
        type = 'exit' 
        AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 10
    `

    console.log("\nFechas después de la corrección:")
    afterFixResult.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Guía: ${row.numero_documento}, Fecha: ${row.fecha_documento}, Formateada: ${row.fecha_formateada}`,
      )
    })
  } catch (error) {
    console.error("Error al corregir fechas de degüellos:", error)
  }
}

fixDeguellosDates()
