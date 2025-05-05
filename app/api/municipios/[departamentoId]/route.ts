import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { departamentoId: string } }) {
  try {
    const departamentoId = Number(params.departamentoId)

    if (!departamentoId || isNaN(departamentoId)) {
      return NextResponse.json({ error: "ID de departamento inválido" }, { status: 400 })
    }

    // Obtener municipios
    const result = await sql`
      SELECT id, name as nombre, cod_dian 
      FROM municipios 
      WHERE id_departamento = ${departamentoId} AND activo = TRUE
      ORDER BY name
    `

    return NextResponse.json({
      municipios: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error(`Error al obtener municipios para departamento ${params.departamentoId}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener municipios",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
