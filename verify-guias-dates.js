import { sql } from "@vercel/postgres"

async function verifyGuiasDates() {
  try {
    console.log("Verificando fechas de guías...")

    // Obtener todas las guías (tipo entry)
    const result = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento,
        fecha_documento AT TIME ZONE 'UTC' AS fecha_utc,
        fecha_documento AT TIME ZONE 'America/Bogota' AS fecha_bogota,
        TO_CHAR(fecha_documento, 'YYYY-MM-DD HH24:MI:SS') AS fecha_str,
        TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS fecha_utc_str,
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS') AS fecha_bogota_str,
        business_location_id
      FROM 
        transactions 
      WHERE 
        type = 'entry' AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 10
    `

    // Mostrar resultados
    console.log(`Se encontraron ${result.rows.length} guías`)

    result.rows.forEach((row) => {
      console.log(`\nGuía ID: ${row.id}, Número: ${row.numero_documento}, Location: ${row.business_location_id}`)
      console.log(`  Fecha original: ${row.fecha_documento}`)
      console.log(`  Fecha UTC: ${row.fecha_utc}`)
      console.log(`  Fecha Bogotá: ${row.fecha_bogota}`)
      console.log(`  Fecha string: ${row.fecha_str}`)
      console.log(`  Fecha UTC string: ${row.fecha_utc_str}`)
      console.log(`  Fecha Bogotá string: ${row.fecha_bogota_str}`)

      // Crear fechas JavaScript para comparar
      const fechaJS = new Date(row.fecha_documento)
      const fechaUTC = new Date(row.fecha_utc)
      const fechaBogota = new Date(row.fecha_bogota)

      console.log(`  Fecha JS: ${fechaJS.toISOString()}`)
      console.log(`  Fecha UTC JS: ${fechaUTC.toISOString()}`)
      console.log(`  Fecha Bogotá JS: ${fechaBogota.toISOString()}`)

      // Formatear para mostrar como DD/MM/YYYY
      const formatDate = (date) => {
        const day = String(date.getUTCDate()).padStart(2, "0")
        const month = String(date.getUTCMonth() + 1).padStart(2, "0")
        const year = date.getUTCFullYear()
        return `${day}/${month}/${year}`
      }

      console.log(`  Formateada (JS): ${formatDate(fechaJS)}`)
      console.log(`  Formateada (UTC): ${formatDate(fechaUTC)}`)
      console.log(`  Formateada (Bogotá): ${formatDate(fechaBogota)}`)
    })
  } catch (error) {
    console.error("Error al verificar fechas:", error)
  } finally {
    console.log("\nVerificación completada")
  }
}

verifyGuiasDates()
