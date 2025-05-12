import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Actualizar ticket2 para que sea igual a ticket en todas las filas
    const updateResult = await sql`
      UPDATE transaction_lines
      SET ticket2 = ticket
      WHERE ticket2 != ticket OR ticket2 IS NULL
      RETURNING id, ticket, ticket2
    `

    return NextResponse.json({
      success: true,
      updatedRows: updateResult.rows,
      message: `Se actualizaron ${updateResult.rows.length} filas para que ticket2 = ticket`,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al corregir tickets: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
