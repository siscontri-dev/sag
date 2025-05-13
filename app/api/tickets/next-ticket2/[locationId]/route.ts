import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { locationId: string } }) {
  try {
    const locationId = Number.parseInt(params.locationId)

    if (isNaN(locationId)) {
      return NextResponse.json({ success: false, message: "ID de ubicación inválido" }, { status: 400 })
    }

    console.log(`Obteniendo siguiente ticket2 para location_id: ${locationId}`)

    // Obtener el primer día del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthStr = firstDayOfMonth.toISOString()

    console.log(`Buscando tickets desde: ${firstDayOfMonthStr}`)

    // Buscar el último ticket2 en transaction_lines para esta ubicación y mes actual
    const result = await sql`
      SELECT MAX(tl.ticket2) as last_ticket2
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.business_location_id = ${locationId}
        AND t.activo = TRUE
        AND t.fecha_creacion >= ${firstDayOfMonthStr}
    `

    let nextTicket2 = 1

    if (result.rows.length > 0 && result.rows[0].last_ticket2) {
      nextTicket2 = Number(result.rows[0].last_ticket2) + 1
    }

    console.log(`Siguiente ticket2: ${nextTicket2}`)

    return NextResponse.json({
      success: true,
      nextTicket2: nextTicket2,
    })
  } catch (error) {
    console.error("Error al obtener siguiente ticket2:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
