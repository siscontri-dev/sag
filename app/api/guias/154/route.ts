import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    console.log("Obteniendo guía 154...")

    // Intentar obtener la guía directamente
    const result = await sql`
      SELECT 
        t.*,
        ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
        ca.nit AS dueno_anterior_nit,
        cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
        cn.nit AS dueno_nuevo_nit
      FROM 
        transactions t
        LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
        LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
      WHERE 
        t.id = 154
    `

    if (result.rows.length === 0) {
      console.log("Guía 154 no encontrada")
      return NextResponse.json({ error: "Guía no encontrada" }, { status: 404 })
    }

    console.log("Guía 154 encontrada:", result.rows[0].id)
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error al obtener guía 154:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
