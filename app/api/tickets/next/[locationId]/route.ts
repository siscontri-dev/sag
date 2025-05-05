import { NextResponse } from "next/server"
import { getNextTicketNumber } from "@/lib/ticket-manager"

export async function GET(request: Request, { params }: { params: { locationId: string } }) {
  try {
    const locationId = Number(params.locationId)

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json({ error: "ID de ubicación inválido" }, { status: 400 })
    }

    const nextTicket = await getNextTicketNumber(locationId)

    return NextResponse.json({
      ticket: nextTicket,
      locationId,
    })
  } catch (error) {
    console.error(`Error al obtener siguiente número de ticket:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener siguiente número de ticket",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
