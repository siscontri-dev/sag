import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Verificar si la guía existe
    const checkResult = await sql`
      SELECT id, activo FROM transactions WHERE id = ${id}
    `

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Guía no encontrada" }, { status: 404 })
    }

    // Activar la guía
    await sql`
      UPDATE transactions SET activo = TRUE WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error al activar guía ID ${params.id}:`, error)
    return NextResponse.json({ success: false, error: "Error al activar la guía" }, { status: 500 })
  }
}
