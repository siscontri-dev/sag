const { sql } = require("@vercel/postgres")

async function main() {
  try {
    console.log("=== DIAGNÓSTICO DE FECHAS EN GUÍAS DE DEGÜELLO ===")

    // 1. Verificar la configuración de zona horaria de PostgreSQL
    const timezoneResult = await sql`SHOW timezone`
    console.log("Zona horaria de PostgreSQL:", timezoneResult.rows[0].timezone)

    // 2. Obtener algunas guías de degüello para bovinos
    console.log("\n=== GUÍAS DE DEGÜELLO PARA BOVINOS ===")
    const bovinosResult = await sql`
      SELECT 
        id,
        fecha_documento,
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formato1,
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_formato2,
        TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'DD/MM/YYYY') as fecha_formato_utc,
        numero_documento
      FROM 
        transactions
      WHERE 
        business_location_id = 1
        AND type = 'exit'
        AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    bovinosResult.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Número: ${row.numero_documento}`)
      console.log(`  Fecha original: ${row.fecha_documento}`)
      console.log(`  Formato 1 (sin zona): ${row.fecha_formato1}`)
      console.log(`  Formato 2 (Bogotá): ${row.fecha_formato2}`)
      console.log(`  Formato UTC: ${row.fecha_formato_utc}`)

      // Analizar si hay diferencia de días entre los formatos
      const [day1, month1, year1] = row.fecha_formato1.split("/").map(Number)
      const [day2, month2, year2] = row.fecha_formato2.split("/").map(Number)

      if (day1 !== day2 || month1 !== month2 || year1 !== year2) {
        console.log(`  ¡ALERTA! Diferencia entre formatos: ${row.fecha_formato1} vs ${row.fecha_formato2}`)
      }
    })

    // 3. Obtener algunas guías de degüello para porcinos
    console.log("\n=== GUÍAS DE DEGÜELLO PARA PORCINOS ===")
    const porcinosResult = await sql`
      SELECT 
        id,
        fecha_documento,
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formato1,
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_formato2,
        TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'DD/MM/YYYY') as fecha_formato_utc,
        numero_documento
      FROM 
        transactions
      WHERE 
        business_location_id = 2
        AND type = 'exit'
        AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    porcinosResult.rows.forEach((row) => {
      console.log(`ID: ${row.id}, Número: ${row.numero_documento}`)
      console.log(`  Fecha original: ${row.fecha_documento}`)
      console.log(`  Formato 1 (sin zona): ${row.fecha_formato1}`)
      console.log(`  Formato 2 (Bogotá): ${row.fecha_formato2}`)
      console.log(`  Formato UTC: ${row.fecha_formato_utc}`)

      // Analizar si hay diferencia de días entre los formatos
      const [day1, month1, year1] = row.fecha_formato1.split("/").map(Number)
      const [day2, month2, year2] = row.fecha_formato2.split("/").map(Number)

      if (day1 !== day2 || month1 !== month2 || year1 !== year2) {
        console.log(`  ¡ALERTA! Diferencia entre formatos: ${row.fecha_formato1} vs ${row.fecha_formato2}`)
      }
    })

    // 4. Verificar la configuración de Next.js
    console.log("\n=== VERIFICACIÓN DE CONFIGURACIÓN ===")
    console.log("Nota: Verifica manualmente los siguientes archivos:")
    console.log("- next.config.mjs: Busca configuraciones de zona horaria")
    console.log("- vercel.json: Busca configuraciones de entorno")
    console.log("- lib/date-utils.ts: Busca funciones de formateo de fechas")

    console.log("\n=== DIAGNÓSTICO COMPLETADO ===")
  } catch (error) {
    console.error("Error durante el diagnóstico:", error)
  } finally {
    process.exit(0)
  }
}

main()
