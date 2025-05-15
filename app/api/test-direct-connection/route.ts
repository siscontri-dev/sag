import { NextResponse } from "next/server"
import { Pool } from "pg"

export async function GET() {
  try {
    console.log("Probando conexión directa a PostgreSQL desde API Route...")

    // Obtener la cadena de conexión
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      throw new Error("No se encontró la variable de entorno DATABASE_URL o POSTGRES_URL")
    }

    // Crear un pool de conexiones
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })

    // Intentar ejecutar una consulta simple
    const result = await pool.query("SELECT NOW() as time, current_setting('timezone') as timezone")

    // Cerrar el pool
    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Conexión directa exitosa",
      time: result.rows[0].time,
      timezone: result.rows[0].timezone,
    })
  } catch (error) {
    console.error("Error al probar conexión directa:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error al conectar",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
