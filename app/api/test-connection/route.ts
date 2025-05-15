import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Intentar ejecutar una consulta simple
    const result = await sql`SELECT NOW() as current_time`

    return NextResponse.json({
      success: true,
      message: "Conexión a la base de datos exitosa",
      time: result.rows[0].current_time,
    })
  } catch (error) {
    console.error("Error al verificar la conexión a la base de datos:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
        error: error instanceof Error ? error.stack : "No hay detalles adicionales",
      },
      { status: 500 },
    )
  }
}
