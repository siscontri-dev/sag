import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Datos de ejemplo para usar en caso de error
const sampleData = [
  {
    Fecha: "01/05/2023",
    "G/ Deguello": "D-001",
    Cantidad: "5",
    "Cantidad Machos": "3",
    "Cantidad Hembras": "2",
    "Vr Deguello": "150,000",
    "Ser. Matadero": "75,000",
    Fedegan: "75,000",
    Total: "225,000",
  },
  {
    Fecha: "02/05/2023",
    "G/ Deguello": "D-002",
    Cantidad: "8",
    "Cantidad Machos": "5",
    "Cantidad Hembras": "3",
    "Vr Deguello": "240,000",
    "Ser. Matadero": "120,000",
    Fedegan: "120,000",
    Total: "360,000",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Ejecutar la consulta SQL para Bovinos (business_location_id = 1)
    const result = await sql`
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
    `

    return NextResponse.json({
      data: result.rows,
    })
  } catch (error) {
    console.error(`Error al obtener datos del Boletín Diario Deguello G/M:`, error)
    // En caso de error, devolver datos de ejemplo
    return NextResponse.json({
      data: sampleData,
      warning: "Se están mostrando datos de ejemplo debido a un error en la conexión a la base de datos",
    })
  }
}
