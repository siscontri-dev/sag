import { Pool } from "pg"

async function checkBoletinMovimiento() {
  try {
    console.log("Verificando conexión a la base de datos...")

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false },
    })

    // Consulta para Bovinos
    console.log("\nEjecutando consulta para Boletín Movimiento de Bovinos...")
    const queryBovinos = `
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
        t.numero_documento AS "G/ Deguello",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999') AS "Cantidad",
        TO_CHAR(t.quantity_m, 'FM999,999') AS "Cantidad Machos",
        TO_CHAR(t.quantity_h, 'FM999,999') AS "Cantidad Hembras",
        TO_CHAR(t.impuesto1, 'FM999,999') AS "Vr Deguello",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Ser. Matadero",
        'Fedegan' AS "Fedegan",
        TO_CHAR(t.impuesto1 + t.impuesto2 + t.impuesto3, 'FM999,999,999') AS "Total"
      FROM
        transactions t
      WHERE
        t.type = 'exit'
        AND t.business_location_id = 1
      ORDER BY
        t.fecha_documento DESC
      LIMIT 5
    `

    const resultBovinos = await pool.query(queryBovinos)
    console.log(`Resultados para Bovinos (${resultBovinos.rows.length} filas):`)
    console.table(resultBovinos.rows)

    // Consulta para Porcinos
    console.log("\nEjecutando consulta para Boletín Movimiento de Porcinos...")
    const queryPorcinos = `
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
        t.numero_documento AS "G/ Deguello",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999') AS "Cantidad",
        TO_CHAR(t.quantity_m, 'FM999,999') AS "Cantidad Machos",
        TO_CHAR(t.quantity_h, 'FM999,999') AS "Cantidad Hembras",
        TO_CHAR(t.impuesto1, 'FM999,999') AS "Vr Deguello",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Ser. Matadero",
        'Porcicultura' AS "Porcicultura",
        TO_CHAR(t.impuesto1 + t.impuesto2 + t.impuesto3, 'FM999,999,999') AS "Total"
      FROM
        transactions t
      WHERE
        t.type = 'exit'
        AND t.business_location_id = 2
      ORDER BY
        t.fecha_documento DESC
      LIMIT 5
    `

    const resultPorcinos = await pool.query(queryPorcinos)
    console.log(`Resultados para Porcinos (${resultPorcinos.rows.length} filas):`)
    console.table(resultPorcinos.rows)

    await pool.end()
    console.log("\nVerificación completada con éxito.")
  } catch (error) {
    console.error("Error durante la verificación:", error)
  }
}

checkBoletinMovimiento()
