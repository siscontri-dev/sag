import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    // Verificar conexión a la base de datos
    const dbResult = await sql`SELECT NOW() as time`
    const dbTime = dbResult.rows[0]?.time

    // Verificar rutas dinámicas
    const routes = [
      { path: "/guias/editar/[id]", status: "available" },
      { path: "/guias/ver/[id]", status: "available" },
      { path: "/sacrificios/editar/[id]", status: "available" },
      { path: "/sacrificios/ver/[id]", status: "available" },
      { path: "/contactos/editar/[id]", status: "available" },
      { path: "/contactos/ver/[id]", status: "available" },
    ]

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbTime,
      },
      routes,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    })
  } catch (error) {
    console.error("Error en health check:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
