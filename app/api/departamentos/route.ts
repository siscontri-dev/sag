import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name as nombre, cod_dian 
      FROM departamentos 
      WHERE activo = TRUE 
      ORDER BY name
    `
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error al obtener departamentos:", error)
    return NextResponse.json({ error: "Error al obtener departamentos" }, { status: 500 })
  }
}
