import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { ticketId: string } }) {
  try {
    const ticketId = Number.parseInt(params.ticketId)

    if (isNaN(ticketId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de ticket inválido",
        },
        { status: 400 },
      )
    }

    // Obtener los datos del ticket
    // Corregido: usar g.name en lugar de g.nombre para la tabla generos
    const result = await sql`
      SELECT 
        tl.*,
        p.name AS product_name,
        r.name AS raza_nombre,
        c.name AS color_nombre,
        g.name AS genero_nombre
      FROM transaction_lines tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors c ON tl.color_id = c.id
      LEFT JOIN generos g ON tl.genero_id = g.id
      WHERE tl.id = ${ticketId} AND tl.activo = true
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se encontró el ticket",
        },
        { status: 404 },
      )
    }

    // Devolver el resultado
    return NextResponse.json({
      success: true,
      message: `Ticket #${ticketId}`,
      ticket: result.rows[0],
    })
  } catch (error) {
    console.error("Error al obtener ticket:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener ticket",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
