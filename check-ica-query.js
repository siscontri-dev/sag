const { sql } = require("@vercel/postgres")

async function checkIcaQuery() {
  try {
    console.log("Intentando ejecutar la consulta ICA...")

    // Ejecutar la consulta para bovinos (business_location_id = 1)
    const result = await sql`
      SELECT
        t.id,
        t.numero_documento AS "Nº Guía",
        t.fecha_documento AS "Fecha",
        CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido) AS "Propietario",
        c.nit AS "NIT",
        TO_CHAR(t.quantity_m, 'FM999,999,999') AS "Machos",
        TO_CHAR(t.quantity_h, 'FM999,999,999') AS "Hembras",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999,999') AS "Total Animales",
        TO_CHAR(t.quantity_k, 'FM999,999,999') AS "Kilos",
        TO_CHAR(t.total, 'FM999,999,999') AS "Total"
      FROM
        transactions t
      LEFT JOIN
        contacts c ON t.id_dueno_anterior = c.id
      WHERE
        t.type = 'entry'
        AND t.business_location_id = 1
      ORDER BY
        t.fecha_documento DESC
      LIMIT 5
    `

    console.log("Consulta ejecutada exitosamente!")
    console.log(`Se encontraron ${result.rows.length} registros.`)

    if (result.rows.length > 0) {
      console.log("\nPrimer registro:")
      console.log(result.rows[0])
    }

    return { success: true, message: "Consulta ejecutada exitosamente" }
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error)
    return {
      success: false,
      message: "Error al ejecutar la consulta",
      error: error.message,
      stack: error.stack,
    }
  }
}

// Ejecutar la función
checkIcaQuery()
  .then((result) => {
    if (!result.success) {
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error("Error inesperado:", err)
    process.exit(1)
  })
