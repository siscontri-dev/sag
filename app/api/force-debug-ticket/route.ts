import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Obtener los últimos 20 registros de transaction_lines con sus valores de ticket y ticket2
    const result = await sql`
      SELECT 
        tl.id, 
        tl.transaction_id, 
        tl.ticket, 
        tl.ticket2,
        t.numero_documento,
        p.name as product_name
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      JOIN products p ON tl.product_id = p.id
      WHERE tl.activo = true
      ORDER BY tl.id DESC
      LIMIT 20
    `

    // Devolver los resultados
    return NextResponse.json({
      success: true,
      message: "Últimos 20 registros de transaction_lines",
      data: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener registros:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener registros",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
