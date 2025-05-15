const { Pool } = require("pg")

async function checkBasculaDiariaQuery() {
  let client = null
  try {
    // Obtener la cadena de conexión de las variables de entorno
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      console.error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
      return
    }

    console.log("Conectando a la base de datos...")

    // Crear un pool de conexiones
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    // Obtener un cliente del pool
    client = await pool.connect()
    console.log("Conexión establecida correctamente")

    // Ejecutar la consulta
    console.log("Ejecutando consulta de Báscula Diaria...")
    const result = await client.query(`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
        MIN(tl.id) AS "Del (Primer Ticket ID)",
        MAX(tl.id) AS "Al (Último Ticket ID)",
        COUNT(tl.id) AS "Tiquetes",
        TO_CHAR(t.quantity_m, 'FM999,999') AS "Nº Machos",
        TO_CHAR(t.quantity_h, 'FM999,999') AS "Nº Hembras",
        TO_CHAR(t.quantity_k, 'FM999,999') AS "Peso (Kg)",
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
        t.fecha_documento::date, t.quantity_m, t.quantity_h, t.quantity_k
      ORDER BY
        t.fecha_documento::date DESC
      LIMIT 5
    `)

    console.log("Consulta ejecutada correctamente")
    console.log(`Se encontraron ${result.rowCount} filas`)

    // Mostrar los resultados
    console.log("\nResultados:")
    console.table(result.rows)
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error)
  } finally {
    // Liberar el cliente
    if (client) {
      client.release()
      console.log("Conexión cerrada")
    }
  }
}

// Ejecutar la función
checkBasculaDiariaQuery()
