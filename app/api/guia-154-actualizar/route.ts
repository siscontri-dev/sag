import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data || data.id !== 154) {
      return NextResponse.json({ success: false, error: "ID de guía inválido" }, { status: 400 })
    }

    console.log("Actualizando guía 154:", data)

    // Convertir el valor de activo a booleano
    const activo = data.activo === true || data.activo === "true"

    // Actualizar la guía
    await sql`
      UPDATE transactions
      SET 
        type = ${data.type || "entry"},
        status = ${data.status || "final"},
        payment_status = ${data.payment_status || "paid"},
        activo = ${activo},
        updated_at = NOW()
      WHERE id = 154
    `

    return NextResponse.json({
      success: true,
      message: "Guía actualizada correctamente",
    })
  } catch (error) {
    console.error("Error al actualizar guía 154:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
