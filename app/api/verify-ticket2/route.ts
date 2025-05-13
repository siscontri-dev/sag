import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Obtener algunos ejemplos de transaction_lines para verificar los valores de ticket y ticket2
    const result = await sql`
      SELECT 
        id, 
        transaction_id, 
        ticket, 
        ticket2, 
        product_id,
        fecha_creacion
      FROM transaction_lines 
      ORDER BY id DESC 
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      message: "Últimos 10 registros de transaction_lines",
      data: result.rows,
    })
  } catch (error) {
    console.error("Error al verificar ticket2:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
