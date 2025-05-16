import { sql } from "@vercel/postgres"

async function checkBoletinQueries() {
  try {
    console.log("Verificando consulta para Boletín Movimiento de Bovinos...")
    const bovinosResult = await sql`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
        t.numero_documento AS "G/ Deguello",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999') AS "Cantidad",
        TO_CHAR(t.quantity_m, 'FM999,999') AS "Cantidad Machos",
        TO_CHAR(t.quantity_h, 'FM999,999') AS "Cantidad Hembras",
        TO_CHAR(t.impuesto1, 'FM999,999') AS "Vr Deguello",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Ser. Matadero",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Fedegan",
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

    console.log("Resultados para Bovinos:")
    console.log(bovinosResult.rows)

    console.log("\nVerificando consulta para Boletín Movimiento de Porcinos...")
    const porcinosResult = await sql`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
        t.numero_documento AS "G/ Deguello",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999') AS "Cantidad",
        TO_CHAR(t.quantity_m, 'FM999,999') AS "Cantidad Machos",
        TO_CHAR(t.quantity_h, 'FM999,999') AS "Cantidad Hembras",
        TO_CHAR(t.impuesto1, 'FM999,999') AS "Vr Deguello",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Ser. Matadero",
        TO_CHAR(t.impuesto2, 'FM999,999') AS "Porcicultura",
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

    console.log("Resultados para Porcinos:")
    console.log(porcinosResult.rows)

    console.log("\nVerificación completada con éxito.")
  } catch (error) {
    console.error("Error al verificar las consultas:", error)
  }
}

checkBoletinQueries()
