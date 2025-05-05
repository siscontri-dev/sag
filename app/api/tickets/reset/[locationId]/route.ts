import { NextResponse } from "next/server"
import { resetTicketCounter } from "@/lib/ticket-manager"

export async function POST(request: Request, { params }: { params: { locationId: string } }) {
  try {
    const locationId = Number(params.locationId)

    if (!locationId || isNaN(locationId)) {
      return NextResponse.json({ error: "ID de ubicación inválido" }, { status: 400 })
    }

    const success = await resetTicketCounter(locationId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Contador de tickets reiniciado correctamente",
        locationId,
        nextTicket: 1, // Explícitamente indicar que el próximo ticket será 1
      })
    } else {
      throw new Error("No se pudo reiniciar el contador de tickets")
    }
  } catch (error) {
    console.error(`Error al reiniciar contador de tickets:`, error)
    return NextResponse.json(
      {
        error: "Error al reiniciar contador de tickets",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
