import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Datos de ejemplo para usar en caso de error
const sampleData = [
  {
    Fecha: "01/05/2023",
    "G/ Deguello": "P-001",
    Cantidad: "10",
    "Cantidad Machos": "6",
    "Cantidad Hembras": "4",
    "Vr Deguello": "200,000",
    "Ser. Matadero": "100,000",
    Porcicultura: "100,000",
    Total: "300,000",
  },
  {
    Fecha: "02/05/2023",
    "G/ Deguello": "P-002",
    Cantidad: "12",
    "Cantidad Machos": "7",
    "Cantidad Hembras": "5",
    "Vr Deguello": "240,000",
    "Ser. Matadero": "120,000",
    Porcicultura: "120,000",
    Total: "360,000",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Ejecutar la consulta SQL corregida para Porcinos (business_location_id = 2)
    const result = await sql`
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
    `

    return NextResponse.json({
      data: result.rows,
    })
  } catch (error) {
    console.error(`Error al obtener datos del Boletín Movimiento de Porcinos:`, error)
    // En caso de error, devolver datos de ejemplo
    return NextResponse.json({
      data: sampleData,
      warning: "Se están mostrando datos de ejemplo debido a un error en la conexión a la base de datos",
    })
  }
}
