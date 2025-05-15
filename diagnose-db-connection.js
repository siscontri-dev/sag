const { Pool } = require("pg")

async function diagnoseDbConnection() {
  console.log("=== DIAGNÓSTICO DE CONEXIÓN A LA BASE DE DATOS ===")

  // 1. Verificar variables de entorno
  console.log("\n1. Verificando variables de entorno...")

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error("❌ No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    return {
      success: false,
      message: "No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL",
      step: "environment_variables",
    }
  }

  console.log("✅ Variable de entorno de conexión encontrada")

  // Ocultar la contraseña para mostrar la URL de conexión de forma segura
  const maskedUrl = databaseUrl.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
  console.log(`   URL de conexión: ${maskedUrl}`)

  // 2. Intentar conectar a la base de datos
  console.log("\n2. Intentando conectar a la base de datos...")

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const client = await pool.connect()
    console.log("✅ Conexión establecida correctamente")

    // 3. Verificar la versión de PostgreSQL
    console.log("\n3. Verificando versión de PostgreSQL...")

    const versionResult = await client.query("SELECT version()")
    console.log(`✅ Versión de PostgreSQL: ${versionResult.rows[0].version}`)

    // 4. Verificar la zona horaria
    console.log("\n4. Verificando zona horaria...")

    const timezoneResult = await client.query("SHOW timezone")
    console.log(`✅ Zona horaria: ${timezoneResult.rows[0].timezone}`)

    // 5. Verificar la hora actual
    console.log("\n5. Verificando hora actual...")

    const timeResult = await client.query("SELECT NOW() as current_time")
    console.log(`✅ Hora actual: ${timeResult.rows[0].current_time}`)

    // 6. Verificar las tablas necesarias
    console.log("\n6. Verificando tablas necesarias...")

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('transactions', 'transaction_lines')
    `)

    if (tablesResult.rows.length < 2) {
      console.error(
        `❌ No se encontraron todas las tablas necesarias. Encontradas: ${tablesResult.rows.map((r) => r.table_name).join(", ")}`,
      )
    } else {
      console.log(`✅ Tablas necesarias encontradas: ${tablesResult.rows.map((r) => r.table_name).join(", ")}`)
    }

    // 7. Verificar datos en las tablas
    console.log("\n7. Verificando datos en las tablas...")

    const transactionsCount = await client.query("SELECT COUNT(*) FROM transactions")
    console.log(`✅ Registros en transactions: ${transactionsCount.rows[0].count}`)

    const transactionLinesCount = await client.query("SELECT COUNT(*) FROM transaction_lines")
    console.log(`✅ Registros en transaction_lines: ${transactionLinesCount.rows[0].count}`)

    // 8. Probar la consulta específica
    console.log("\n8. Probando la consulta específica...")

    const testQuery = `
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
      LIMIT 1
    `

    try {
      const queryResult = await client.query(testQuery)
      if (queryResult.rows.length > 0) {
        console.log("✅ Consulta ejecutada correctamente")
        console.log("   Resultado de ejemplo:")
        console.log(queryResult.rows[0])
      } else {
        console.log("✅ Consulta ejecutada correctamente, pero no se encontraron resultados")
      }
    } catch (queryError) {
      console.error("❌ Error al ejecutar la consulta específica:", queryError.message)
      return {
        success: false,
        message: "Error al ejecutar la consulta específica",
        error: queryError.message,
        step: "test_query",
      }
    }

    // Liberar el cliente
    client.release()

    console.log("\n=== DIAGNÓSTICO COMPLETADO EXITOSAMENTE ===")
    return {
      success: true,
      message: "Conexión a la base de datos verificada correctamente",
      postgresVersion: versionResult.rows[0].version,
      timezone: timezoneResult.rows[0].timezone,
      currentTime: timeResult.rows[0].current_time,
      tables: tablesResult.rows.map((r) => r.table_name),
      transactionsCount: transactionsCount.rows[0].count,
      transactionLinesCount: transactionLinesCount.rows[0].count,
    }
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message)

    // Diagnóstico adicional basado en el error
    if (error.message.includes("timeout")) {
      console.error("   Posible problema: Timeout de conexión. Verifica el firewall o la red.")
    } else if (error.message.includes("password authentication failed")) {
      console.error("   Posible problema: Credenciales incorrectas.")
    } else if (error.message.includes("database") && error.message.includes("does not exist")) {
      console.error("   Posible problema: La base de datos especificada no existe.")
    } else if (error.message.includes("no pg_hba.conf entry")) {
      console.error("   Posible problema: Restricciones de acceso en el servidor PostgreSQL.")
    } else if (error.message.includes("WebSocket")) {
      console.error("   Posible problema: Error de conexión WebSocket. Verifica si estás en un entorno serverless.")
    }

    return {
      success: false,
      message: "Error al conectar a la base de datos",
      error: error.message,
      step: "connection",
    }
  } finally {
    // Cerrar el pool
    await pool.end()
  }
}

// Ejecutar la función si este archivo se ejecuta directamente
if (require.main === module) {
  diagnoseDbConnection()
    .then((result) => {
      if (!result.success) {
        console.error("\n❌ Diagnóstico fallido:", result.message)
        console.error("   Paso:", result.step)
        if (result.error) {
          console.error("   Error:", result.error)
        }
        process.exit(1)
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error("\n❌ Error no controlado:", error)
      process.exit(1)
    })
}

module.exports = diagnoseDbConnection
