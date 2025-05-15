const { Pool } = require("pg")

async function checkConnection() {
  console.log("Verificando conexión a la base de datos...")

  // Obtener la cadena de conexión
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.error("ERROR: No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    return
  }

  console.log("Cadena de conexión encontrada")

  // Crear el pool de conexiones
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    console.log("Intentando conectar a la base de datos...")

    // Probar la conexión
    const client = await pool.connect()
    console.log("Conexión exitosa a la base de datos")

    // Verificar la versión de PostgreSQL
    const versionResult = await client.query("SELECT version()")
    console.log("Versión de PostgreSQL:", versionResult.rows[0].version)

    // Verificar la zona horaria
    const timezoneResult = await client.query("SHOW timezone")
    console.log("Zona horaria de la base de datos:", timezoneResult.rows[0].timezone)

    // Verificar la hora actual
    const timeResult = await client.query("SELECT NOW() as now")
    console.log("Hora actual de la base de datos:", timeResult.rows[0].now)

    // Probar la consulta específica
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
      console.log("Primer registro:", result.rows[0])
    } else {
      console.log("No se encontraron registros.")
    }

    // Liberar el cliente
    client.release()
  } catch (error) {
    console.error("ERROR al conectar a la base de datos:", error)
    console.error("Detalles del error:", error.stack)

    if (error.code) {
      console.error("Código de error:", error.code)
    }

    if (error.message && error.message.includes("WebSocket")) {
      console.error("\nERROR DE WEBSOCKET: Este error puede ocurrir en entornos serverless como Vercel.")
      console.error("Recomendación: Utilizar una conexión directa sin WebSockets o usar un proxy de base de datos.")
    }
  } finally {
    // Cerrar el pool
    await pool.end()
    console.log("Verificación de conexión finalizada")
  }
}

checkConnection().catch(console.error)
