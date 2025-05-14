import { sql } from "@vercel/postgres"

async function diagnoseGuiasDates() {
  try {
    console.log("=== DIAGNÓSTICO DE FECHAS EN GUÍAS ===")
    console.log("Comparando fechas en diferentes formatos y zonas horarias")
    console.log("=========================================")

    // Verificar la configuración de zona horaria de PostgreSQL
    const timeZoneConfig = await sql`SHOW timezone;`
    console.log(`Zona horaria actual de PostgreSQL: ${timeZoneConfig.rows[0].timezone}`)

    // Obtener la hora actual del servidor de base de datos
    const currentTime = await sql`SELECT NOW() as now, NOW()::text as now_text;`
    console.log(`Hora actual del servidor: ${currentTime.rows[0].now_text}`)

    // Obtener algunas guías para analizar
    const guiasResult = await sql`
      SELECT 
        id, 
        numero_documento, 
        fecha_documento,
        fecha_documento::text as fecha_raw,
        TO_CHAR(fecha_documento, 'YYYY-MM-DD HH24:MI:SS') as fecha_local,
        TO_CHAR(fecha_documento AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') as fecha_utc,
        TO_CHAR(fecha_documento AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD HH24:MI:SS') as fecha_bogota,
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_formato_actual,
        business_location_id
      FROM 
        transactions 
      WHERE 
        type = 'entry' AND activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 5
    `

    console.log("\n=== ANÁLISIS DE GUÍAS ===")
    guiasResult.rows.forEach((guia) => {
      console.log(`\nGuía ID: ${guia.id}, Número: ${guia.numero_documento}`)
      console.log(`  Fecha raw: ${guia.fecha_raw}`)
      console.log(`  Fecha local: ${guia.fecha_local}`)
      console.log(`  Fecha UTC: ${guia.fecha_utc}`)
      console.log(`  Fecha Bogotá: ${guia.fecha_bogota}`)
      console.log(`  Formato actual (DD/MM/YYYY): ${guia.fecha_formato_actual}`)
    })

    // Verificar si hay diferencia de un día entre formatos
    console.log("\n=== VERIFICACIÓN DE DIFERENCIA DE DÍAS ===")
    for (const guia of guiasResult.rows) {
      // Extraer componentes de fecha de los diferentes formatos
      const [yearLocal, monthLocal, dayLocal] = guia.fecha_local.split(" ")[0].split("-").map(Number)
      const [yearUTC, monthUTC, dayUTC] = guia.fecha_utc.split(" ")[0].split("-").map(Number)
      const [yearBogota, monthBogota, dayBogota] = guia.fecha_bogota.split(" ")[0].split("-").map(Number)

      const [dayFormato, monthFormato, yearFormato] = guia.fecha_formato_actual.split("/").map(Number)

      console.log(`\nGuía ID: ${guia.id}`)
      console.log(`  Local: ${dayLocal}/${monthLocal}/${yearLocal}`)
      console.log(`  UTC: ${dayUTC}/${monthUTC}/${yearUTC}`)
      console.log(`  Bogotá: ${dayBogota}/${monthBogota}/${yearBogota}`)
      console.log(`  Formato actual: ${dayFormato}/${monthFormato}/${yearFormato}`)

      // Verificar diferencias
      if (dayLocal !== dayUTC || monthLocal !== monthUTC || yearLocal !== yearUTC) {
        console.log(`  ⚠️ DIFERENCIA entre Local y UTC`)
      }

      if (dayLocal !== dayBogota || monthLocal !== monthBogota || yearLocal !== yearBogota) {
        console.log(`  ⚠️ DIFERENCIA entre Local y Bogotá`)
      }

      if (dayFormato !== dayBogota || monthFormato !== monthBogota || yearFormato !== yearBogota) {
        console.log(`  ⚠️ DIFERENCIA entre Formato actual y Bogotá`)
      }
    }
  } catch (error) {
    console.error("Error durante el diagnóstico:", error)
  }
}

diagnoseGuiasDates()
