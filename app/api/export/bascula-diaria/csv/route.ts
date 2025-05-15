import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()
    const { title, headers, rows } = data

    // Crear el contenido CSV
    let csvContent = `${title}\n\n`

    // Añadir encabezados
    csvContent += headers.join(",") + "\n"

    // Añadir filas
    rows.forEach((row) => {
      const rowData = [
        `"${row.fecha}"`,
        `"${row.delTicket}"`,
        `"${row.alTicket}"`,
        `"${row.tiquetes}"`,
        `"${row.machos}"`,
        `"${row.hembras}"`,
        `"${row.peso}"`,
        `"${row.valorUnitario}"`,
        `"${row.totalValor}"`,
      ]
      csvContent += rowData.join(",") + "\n"
    })

    // Devolver el archivo CSV como respuesta
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=bascula_diaria_${new Date().toISOString().split("T")[0]}.csv`,
      },
    })
  } catch (error) {
    console.error("Error al exportar a CSV:", error)
    return NextResponse.json({ error: "Error al exportar a CSV" }, { status: 500 })
  }
}
