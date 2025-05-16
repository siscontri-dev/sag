import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: Request) {
  try {
    const { title, boletinNumber, headers, rows, filterInfo } = await request.json()

    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new()

    // Crear una hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet([])

    // Agregar título
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ["CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA"],
        [title],
        [`Boletín No. ${boletinNumber}`],
        [""],
        ["Filtros aplicados:"],
        [`Rango de fechas: ${filterInfo.dateRange}`],
        [`Término de búsqueda: ${filterInfo.searchTerm}`],
        [""],
        headers,
      ],
      { origin: "A1" },
    )

    // Agregar datos
    XLSX.utils.sheet_add_aoa(ws, rows, { origin: `A${9 + 1}` })

    // Establecer anchos de columna
    const colWidths = [
      { wch: 15 }, // Fecha
      { wch: 15 }, // G/ Deguello
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Cantidad Machos
      { wch: 15 }, // Cantidad Hembras
      { wch: 15 }, // Vr Deguello
      { wch: 15 }, // Ser. Matadero
      { wch: 12 }, // Fedegan
      { wch: 15 }, // Total
    ]
    ws["!cols"] = colWidths

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Boletín Bovinos")

    // Convertir el libro a un buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Devolver el archivo Excel
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="boletin-movimiento-bovinos-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al generar Excel:", error)
    return NextResponse.json({ error: "Error al generar Excel" }, { status: 500 })
  }
}
