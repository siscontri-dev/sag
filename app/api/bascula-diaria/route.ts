import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Datos de ejemplo para usar en caso de error
const sampleData = [
  {
    Fecha: "01/05/2023",
    "Del (Primer Ticket ID)": "1001",
    "Al (Último Ticket ID)": "1025",
    Tiquetes: "25",
    "Nº Machos": "150",
    "Nº Hembras": "100",
    "Peso (Kg)": "25,000",
    "Valor Servicio Unitario": "25,000",
    "Total Valor Servicio": "625,000",
  },
  {
    Fecha: "02/05/2023",
    "Del (Primer Ticket ID)": "1026",
    "Al (Último Ticket ID)": "1050",
    Tiquetes: "25",
    "Nº Machos": "180",
    "Nº Hembras": "70",
    "Peso (Kg)": "27,500",
    "Valor Servicio Unitario": "25,000",
    "Total Valor Servicio": "625,000",
  },
  {
    Fecha: "03/05/2023",
    "Del (Primer Ticket ID)": "1051",
    "Al (Último Ticket ID)": "1080",
    Tiquetes: "30",
    "Nº Machos": "200",
    "Nº Hembras": "100",
    "Peso (Kg)": "30,000",
    "Valor Servicio Unitario": "25,000",
    "Total Valor Servicio": "750,000",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Ejecutar la consulta actualizada con SUM() para las cantidades y GROUP BY simplificado
    const result = await sql`
      SELECT
        TO_CHAR(t.fecha_documento::date, 'DD/MM/YYYY') AS "Fecha",
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
    `

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error(`Error al obtener datos de Báscula Diaria:`, error)
    // En caso de error, devolver datos de ejemplo
    return NextResponse.json({
      data: sampleData,
      warning: "Se están mostrando datos de ejemplo debido a un error en la conexión a la base de datos",
    })
  }
}
