import { NextResponse } from "next/server"
import { getTransactions } from "@/lib/data"
import * as XLSX from "xlsx"

export async function GET(request: Request) {
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url)
    const tipo = url.searchParams.get("tipo") || undefined
    const estado = url.searchParams.get("estado") || undefined

    console.log("Exportando guías a Excel:", { tipo, estado })

    // Obtener las guías
    let guias = await getTransactions("entry", tipo)

    // Filtrar por estado si se especifica
    if (estado && estado !== "todas") {
      guias = guias.filter((g) => g.estado === estado)
    }

    console.log(`Total de guías a exportar: ${guias.length}`)

    // Preparar los datos para Excel
    const data = guias.map((guia) => ({
      Número: guia.numero_documento,
      Fecha: new Date(guia.fecha_documento).toLocaleDateString("es-CO"),
      "Dueño Anterior": guia.dueno_anterior_nombre || "N/A",
      "Dueño Nuevo": guia.dueno_nuevo_nombre || "N/A",
      Machos: guia.quantity_m || 0,
      Hembras: guia.quantity_h || 0,
      Kilos: guia.quantity_k || 0,
      Estado: guia.estado === "confirmado" ? "Confirmado" : guia.estado === "anulado" ? "Anulado" : "Borrador",
      Total: guia.total || 0,
    }))

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Guías ICA")

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 10 }, // Número
      { wch: 12 }, // Fecha
      { wch: 25 }, // Dueño Anterior
      { wch: 25 }, // Dueño Nuevo
      { wch: 10 }, // Machos
      { wch: 10 }, // Hembras
      { wch: 10 }, // Kilos
      { wch: 12 }, // Estado
      { wch: 15 }, // Total
    ]
    worksheet["!cols"] = colWidths

    // Convertir a buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Devolver como archivo para descargar
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="guias_ica_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar guías a Excel:", error)
    return NextResponse.json({ error: `Error al exportar guías a Excel: ${error.message}` }, { status: 500 })
  }
}
