import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request, { params }: { params: { guiaId: string } }) {
  try {
    const guiaId = params.guiaId

    // Consulta para obtener los tickets de una guía específica con todos los datos necesarios
    const result = await sql`
      SELECT 
        tl.*,
        p.name AS product_name,
        r.nombre AS raza_nombre,
        c.nombre AS color_nombre,
        g.nombre AS genero_nombre,
        t.fecha_documento AS fecha,
        t.total AS valor,
        con.nombre AS dueno_nombre,
        con.identificacion AS dueno_identificacion
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors c ON tl.color_id = c.id
      LEFT JOIN generos g ON tl.genero_id = g.id
      LEFT JOIN contacts con ON t.id_dueno_anterior = con.id
      WHERE tl.transaction_id = ${guiaId} AND tl.activo = true
      ORDER BY tl.ticket2 ASC NULLS LAST, tl.ticket ASC NULLS LAST
    `

    return NextResponse.json({
      success: true,
      message: `Tickets de la guía ${guiaId}`,
      tickets: result.rows,
    })
  } catch (error) {
    console.error("Error al obtener tickets por guía:", error)
    return NextResponse.json({ error: "Error al obtener tickets por guía", details: error.message }, { status: 500 })
  }
}
