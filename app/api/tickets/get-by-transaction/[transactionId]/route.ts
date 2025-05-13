import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { transactionId: string } }) {
  try {
    const transactionId = Number.parseInt(params.transactionId)

    if (isNaN(transactionId)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de transacción inválido",
        },
        { status: 400 },
      )
    }

    // Obtener los datos de los tickets para esta transacción
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
      WHERE tl.transaction_id = ${transactionId} AND tl.activo = true
      ORDER BY tl.id
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No se encontraron tickets para esta transacción",
        },
        { status: 404 },
      )
    }

    // Devolver los resultados
    return NextResponse.json({
      success: true,
      message: `Tickets para la transacción ${transactionId}`,
      tickets: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener tickets",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
