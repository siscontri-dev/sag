const { Pool, Client } = require("pg")

async function diagnoseConnection() {
  console.log("=== DIAGNÓSTICO COMPLETO DE CONEXIÓN A LA BASE DE DATOS ===")
  console.log("Fecha y hora:", new Date().toISOString())
  console.log("Entorno:", process.env.NODE_ENV || "no definido")
  console.log("Vercel ENV:", process.env.VERCEL_ENV || "no definido")

  // Verificar variables de entorno
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!connectionString) {
    console.error("ERROR: No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    return
  }

  console.log("Variable de entorno de conexión encontrada")

  // Intentar conexión con Pool
  console.log("\n=== PRUEBA DE CONEXIÓN CON POOL ===")
  try {
    console.log("Creando pool de conexiones...")
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000, // 10 segundos
    })

    console.log("Obteniendo conexión del pool...")
    const client = await pool.connect()
    console.log("Conexión exitosa con Pool")

    // Verificar la versión de PostgreSQL
    const versionResult = await client.query("SELECT version()")
    console.log("Versión de PostgreSQL:", versionResult.rows[0].version)

    // Verificar la zona horaria
    const timezoneResult = await client.query("SHOW timezone")
    console.log("Zona horaria de la base de datos:", timezoneResult.rows[0].timezone)

    // Verificar la hora actual
    const timeResult = await client.query("SELECT NOW() as now")
    console.log("Hora actual de la base de datos:", timeResult.rows[0].now)

    // Liberar el cliente
    client.release()

    // Cerrar el pool
    await pool.end()
    console.log("Pool cerrado correctamente")
  } catch (error) {
    console.error("ERROR en la conexión con Pool:", error)
    console.error("Detalles:", error.stack)
  }

  // Intentar conexión con Client
  console.log("\n=== PRUEBA DE CONEXIÓN CON CLIENT ===")
  try {
    console.log("Creando cliente directo...")
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000, // 10 segundos
    })

    console.log("Conectando cliente...")
    await client.connect()
    console.log("Conexión exitosa con Client")

    // Verificar la versión de PostgreSQL
    const versionResult = await client.query("SELECT version()")
    console.log("Versión de PostgreSQL:", versionResult.rows[0].version)

    // Verificar la zona horaria
    const timezoneResult = await client.query("SHOW timezone")
    console.log("Zona horaria de la base de datos:", timezoneResult.rows[0].timezone)

    // Verificar la hora actual
    const timeResult = await client.query("SELECT NOW() as now")
    console.log("Hora actual de la base de datos:", timeResult.rows[0].now)

    // Cerrar el cliente
    await client.end()
    console.log("Cliente cerrado correctamente")
  } catch (error) {
    console.error("ERROR en la conexión con Client:", error)
    console.error("Detalles:", error.stack)
  }

  // Probar la consulta específica
  console.log("\n=== PRUEBA DE CONSULTA ESPECÍFICA ===")
  try {
    console.log("Creando cliente para consulta específica...")
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000, // 10 segundos
    })

    console.log("Conectando cliente...")
    await client.connect()
    console.log("Conexión exitosa")

    console.log("Ejecutando consulta de recaudo acumulado diario...")
    const queryText = `
      SELECT
          t.fecha_documento::date AS "Fecha",
          MIN(tl.id) AS "Del (Primer Ticket ID)",
          MAX(tl.id) AS "Al (Último Ticket ID)",    
          COUNT(tl.id) AS "Tiquetes",
          TO_CHAR(SUM(t.quantity_m), 'FM999,999') AS "Nº Machos",
          TO_CHAR(SUM(t.quantity_h), 'FM999,999') AS "Nº Hembras",
          TO_CHAR(SUM(t.quantity_k), 'FM999,999') AS "Peso (Kg)",
          TO_CHAR(SUM(tl.valor) / NULLIF(COUNT(tl.id), 0), 'FM999,999') AS "Valor Servicio Unitario",
          TO_CHAR(SUM(tl.valor), 'FM999,999,999') AS "Total Valor Servicio"
      FROM
          transactions t
      JOIN
          transaction_lines tl ON tl.transaction_id = t.id
      WHERE
          t.type = 'entry'
          AND t.business_location_id = 2
      GROUP BY
          t.fecha_documento::date
      ORDER BY
          t.fecha_documento::date DESC
      LIMIT 5
    `

    const result = await client.query(queryText)
    console.log(`Consulta ejecutada correctamente. Se encontraron ${result.rows.length} registros.`)

    if (result.rows.length > 0) {
      console.log("Primer registro:", JSON.stringify(result.rows[0], null, 2))
    } else {
      console.log("No se encontraron registros.")
    }

    // Cerrar el cliente
    await client.end()
    console.log("Cliente cerrado correctamente")
  } catch (error) {
    console.error("ERROR en la consulta específica:", error)
    console.error("Detalles:", error.stack)
  }

  console.log("\n=== DIAGNÓSTICO FINALIZADO ===")
}

diagnoseConnection().catch(console.error)
