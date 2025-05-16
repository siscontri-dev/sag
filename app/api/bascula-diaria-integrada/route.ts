import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Datos de ejemplo para usar en caso de error
const sampleData = {
  bovinos: [
    {
      fecha: "01/05/2023",
      tiquetes: "25",
      cantidad: "350",
      valorUnitario: "30,000",
      total: "750,000",
    },
    {
      fecha: "02/05/2023",
      tiquetes: "30",
      cantidad: "400",
      valorUnitario: "30,000",
      total: "900,000",
    },
  ],
  porcinos: [
    {
      fecha: "01/05/2023",
      tiquetes: "35",
      cantidad: "250",
      valorUnitario: "25,000",
      total: "875,000",
    },
    {
      fecha: "02/05/2023",
      tiquetes: "40",
      cantidad: "300",
      valorUnitario: "25,000",
      total: "1,000,000",
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    // Consulta para bovinos (ganado mayor)
    const bovinosResult = await sql`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS fecha,
        COUNT(tl.id) AS tiquetes,
        TO_CHAR(SUM(t.quantity_m + t.quantity_h), 'FM999,999') AS cantidad,
        TO_CHAR(SUM(tl.valor) / NULLIF(COUNT(tl.id), 0), 'FM999,999') AS valor_unitario,
        TO_CHAR(SUM(tl.valor), 'FM999,999,999') AS total
      FROM
        transactions t
      JOIN
        transaction_lines tl ON tl.transaction_id = t.id
      WHERE
        t.type = 'entry'
        AND t.business_location_id = 1
      GROUP BY
        t.fecha_documento::date
      ORDER BY
        t.fecha_documento::date DESC
    `

    // Consulta para porcinos (ganado menor)
    const porcinosResult = await sql`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS fecha,
        COUNT(tl.id) AS tiquetes,
        TO_CHAR(SUM(t.quantity_m + t.quantity_h), 'FM999,999') AS cantidad,
        TO_CHAR(SUM(tl.valor) / NULLIF(COUNT(tl.id), 0), 'FM999,999') AS valor_unitario,
        TO_CHAR(SUM(tl.valor), 'FM999,999,999') AS total
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
    `

    return NextResponse.json({
      data: {
        bovinos: bovinosResult.rows,
        porcinos: porcinosResult.rows,
      },
    })
  } catch (error) {
    console.error(`Error al obtener datos de Báscula Diaria Integrada:`, error)
    // En caso de error, devolver datos de ejemplo
    return NextResponse.json({
      data: sampleData,
      warning: "Se están mostrando datos de ejemplo debido a un error en la conexión a la base de datos",
    })
  }
}
