import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { departamentoId: string } }) {
  try {
    const departamentoId = Number(params.departamentoId)

    if (!departamentoId || isNaN(departamentoId)) {
      return NextResponse.json({ error: "ID de departamento inválido" }, { status: 400 })
    }

    // Verificar si el departamento existe
    const deptoCheck = await sql`
      SELECT id, name FROM departamentos WHERE id = ${departamentoId}
    `

    if (deptoCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Departamento no encontrado",
          departamentoId,
        },
        { status: 404 },
      )
    }

    const departamento = deptoCheck.rows[0]

    // Obtener municipios
    const result = await sql`
      SELECT id, name as nombre, cod_dian 
      FROM municipios 
      WHERE id_departamento = ${departamentoId} AND activo = TRUE
      ORDER BY name
    `

    // Incluir información detallada en la respuesta
    return NextResponse.json({
      municipios: result.rows,
      departamento: {
        id: departamento.id,
        nombre: departamento.name,
      },
      count: result.rows.length,
      query: `id_departamento = ${departamentoId} AND activo = TRUE`,
    })
  } catch (error) {
    console.error(`Error al obtener municipios para departamento ${params.departamentoId}:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener municipios",
        message: error.message,
        departamentoId: params.departamentoId,
      },
      { status: 500 },
    )
  }
}
