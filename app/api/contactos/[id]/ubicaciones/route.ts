import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "ID de contacto inválido" }, { status: 400 })
    }

    const result = await sql`
      SELECT 
        uc.*,
        d.name as departamento_nombre,
        m.name as municipio_nombre
      FROM 
        ubication_contact uc
        JOIN departamentos d ON uc.id_departamento = d.id
        JOIN municipios m ON uc.id_municipio = m.id
      WHERE 
        uc.id_contact = ${Number(id)} AND uc.activo = TRUE
      ORDER BY 
        uc.es_principal DESC, uc.nombre_finca
    `

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error al obtener ubicaciones del contacto:", error)
    return NextResponse.json({ error: "Error al obtener ubicaciones del contacto" }, { status: 500 })
  }
}
