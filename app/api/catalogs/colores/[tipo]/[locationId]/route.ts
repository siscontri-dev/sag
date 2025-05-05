import { NextResponse } from "next/server"
import { getColoresByTipoAndLocation } from "@/lib/catalogs"

export async function GET(request: Request, { params }: { params: { tipo: string; locationId: string } }) {
  try {
    const tipo = params.tipo
    const locationId = Number.parseInt(params.locationId)

    if (!tipo || isNaN(locationId)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    const colores = await getColoresByTipoAndLocation(tipo, locationId)

    return NextResponse.json({
      colores,
      count: colores.length,
    })
  } catch (error) {
    console.error(`Error al obtener colores:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener colores",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
