import { NextResponse } from "next/server"
import { getCurrentTicketCount } from "@/lib/ticket-manager"

export async function GET(request: Request, { params }: { params: { locationId: string } }) {
  try {
    const locationId = Number(params.locationId)

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json({ error: "ID de ubicación inválido" }, { status: 400 })
    }

    const currentCount = await getCurrentTicketCount(locationId)

    return NextResponse.json({
      success: true,
      currentCount: currentCount,
      nextTicket: currentCount + 1,
    })
  } catch (error) {
    console.error(`Error al obtener contador de tickets:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener contador de tickets",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
