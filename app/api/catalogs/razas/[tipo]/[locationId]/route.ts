import { NextResponse } from "next/server"
import { getRazasByTipoAndLocation } from "@/lib/catalogs"

export async function GET(request: Request, { params }: { params: { tipo: string; locationId: string } }) {
  try {
    const tipo = params.tipo
    const locationId = Number.parseInt(params.locationId)

    if (!tipo || isNaN(locationId)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    const razas = await getRazasByTipoAndLocation(tipo, locationId)

    return NextResponse.json({
      razas,
      count: razas.length,
    })
  } catch (error) {
    console.error(`Error al obtener razas:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener razas",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
