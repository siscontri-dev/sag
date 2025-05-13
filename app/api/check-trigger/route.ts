import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar si el trigger existe
    const triggerResult = await sql`
      SELECT tgname FROM pg_trigger 
      WHERE tgname = 'tr_generate_monthly_ticket'
    `

    const triggerExists = triggerResult.rows.length > 0

    // Si el trigger existe, verificar su definición
    let triggerDefinition = null
    if (triggerExists) {
      const definitionResult = await sql`
        SELECT pg_get_triggerdef(oid) AS definition
        FROM pg_trigger
        WHERE tgname = 'tr_generate_monthly_ticket'
      `
      triggerDefinition = definitionResult.rows[0]?.definition
    }

    // Verificar si la función existe
    const functionResult = await sql`
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'generate_monthly_ticket_number'
    `

    const functionExists = functionResult.rows.length > 0
    const functionSource = functionExists ? functionResult.rows[0].prosrc : null

    return NextResponse.json({
      success: true,
      triggerExists,
      triggerDefinition,
      functionExists,
      functionSource,
    })
  } catch (error) {
    console.error("Error al verificar trigger:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
