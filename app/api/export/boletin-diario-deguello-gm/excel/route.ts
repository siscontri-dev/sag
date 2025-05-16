import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { title, data, boletinNumber, filters } = await request.json()

    // Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new()

    // Crear una hoja de trabajo con los datos
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Añadir la hoja de trabajo al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Boletin")

    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Devolver el archivo Excel como respuesta
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="boletin_diario_deguello_gm_${boletinNumber}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al generar Excel:", error)
    return NextResponse.json({ error: "Error al generar Excel" }, { status: 500 })
  }
}
