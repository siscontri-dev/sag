import { type NextRequest, NextResponse } from "next/server"
import { Client } from "pg"

// Datos de ejemplo para usar en caso de error
const sampleData = [
  {
    Fecha: "01/05/2023",
    "Del (Primer Ticket ID)": "2001",
    "Al (Último Ticket ID)": "2025",
    Tiquetes: "25",
    "Nº Machos": "200",
    "Nº Hembras": "150",
    "Peso (Kg)": "35,000",
    "Valor Servicio Unitario": "30,000",
    "Total Valor Servicio": "750,000",
  },
  {
    Fecha: "02/05/2023",
    "Del (Primer Ticket ID)": "2026",
    "Al (Último Ticket ID)": "2050",
    Tiquetes: "25",
    "Nº Machos": "220",
    "Nº Hembras": "130",
    "Peso (Kg)": "37,500",
    "Valor Servicio Unitario": "30,000",
    "Total Valor Servicio": "750,000",
  },
  {
    Fecha: "03/05/2023",
    "Del (Primer Ticket ID)": "2051",
    "Al (Último Ticket ID)": "2080",
    Tiquetes: "30",
    "Nº Machos": "250",
    "Nº Hembras": "150",
    "Peso (Kg)": "40,000",
    "Valor Servicio Unitario": "30,000",
    "Total Valor Servicio": "900,000",
  },
]

export async function GET(request: NextRequest) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!connectionString) {
    console.warn("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL, usando datos de ejemplo")
    return NextResponse.json({ data: sampleData })
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000, // 5 segundos de timeout
  })

  try {
    await client.connect()

    // Ejecutar la consulta para bovinos (business_location_id = 1)
    const result = await client.query(`
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
        AND t.business_location_id = 1
      GROUP BY
        t.fecha_documento::date
      ORDER BY
        t.fecha_documento::date DESC
    `)

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error(`Error al obtener datos de Báscula Diaria Bovinos (alt):`, error)
    // En caso de error, devolver datos de ejemplo
    return NextResponse.json({
      data: sampleData,
      warning: "Se están mostrando datos de ejemplo debido a un error en la conexión a la base de datos",
    })
  } finally {
    await client.end()
  }
}
