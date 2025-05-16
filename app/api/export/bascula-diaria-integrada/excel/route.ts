import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
  try {
    // Obtener los datos de la solicitud
    const data = await request.json()
    const { title, headers, rows, totals, filters } = data

    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new()

    // Preparar los datos para la hoja de cálculo
    const wsData = []

    // Título
    wsData.push([title])
    wsData.push([])

    // Información de filtros
    wsData.push(["Filtros aplicados:"])
    wsData.push(["Rango de fechas:", filters.dateRange])
    wsData.push(["Término de búsqueda:", filters.searchTerm])
    wsData.push([])

    // Encabezados
    wsData.push(headers)

    // Filas de datos
    rows.forEach((row) => {
      wsData.push(row)
    })

    // Totales
    wsData.push(totals)

    // Crear la hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Aplicar estilos (en la medida de lo posible con XLSX)
    // Combinar celdas para el título
    if (!ws["!merges"]) ws["!merges"] = []
    ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } })

    // Establecer anchos de columna
    ws["!cols"] = [
      { width: 15 }, // Fecha
      { width: 15 }, // Tiquetes G/May
      { width: 10 }, // Cant
      { width: 10 }, // Vr. Uni
      { width: 15 }, // Total G/May
      { width: 15 }, // Tiquetes G/Men
      { width: 10 }, // Cant
      { width: 10 }, // Vr. Uni
      { width: 15 }, // Total G/Men
    ]

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Báscula Integrada")

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Devolver el archivo como respuesta
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="bascula-diaria-integrada-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al generar Excel:", error)
    return NextResponse.json(
      { error: `Error al generar Excel: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
