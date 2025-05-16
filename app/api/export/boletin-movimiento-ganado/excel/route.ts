import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

// Interfaces para los datos
interface BoletinItem {
  Fecha: string
  "G/ Deguello": string
  Cantidad: string
  "Cantidad Machos": string
  "Cantidad Hembras": string
  "Vr Deguello": string
  "Ser. Matadero": string
  Entidad: string
  Total: string
}

interface ExportData {
  title: string
  data: BoletinItem[]
  boletinNumber: string
  filters?: {
    dateRange: string | null
    searchTerm: string | null
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json()

    // Calcular totales
    const totales = data.data.reduce(
      (acc, item) => {
        acc.cantidad += Number.parseInt(item.Cantidad?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadMachos += Number.parseInt(item["Cantidad Machos"]?.replace(/,/g, "") || "0", 10) || 0
        acc.cantidadHembras += Number.parseInt(item["Cantidad Hembras"]?.replace(/,/g, "") || "0", 10) || 0
        acc.vrDeguello += Number.parseInt(item["Vr Deguello"]?.replace(/,/g, "") || "0", 10) || 0
        acc.serMatadero += Number.parseInt(item["Ser. Matadero"]?.replace(/,/g, "") || "0", 10) || 0
        acc.total += Number.parseInt(item.Total?.replace(/,/g, "") || "0", 10) || 0
        return acc
      },
      {
        cantidad: 0,
        cantidadMachos: 0,
        cantidadHembras: 0,
        vrDeguello: 0,
        serMatadero: 0,
        total: 0,
      },
    )

    // Crear una hoja de cálculo
    const ws = XLSX.utils.aoa_to_sheet([
      [data.title || `Boletín Movimiento de Ganado - ${data.boletinNumber}`],
      [`Boletín No. ${data.boletinNumber}`],
      [],
      data.filters?.dateRange ? ["Rango de fechas:", data.filters.dateRange] : [],
      data.filters?.searchTerm ? ["Término de búsqueda:", data.filters.searchTerm] : [],
      [],
      [
        "Fecha",
        "G/ Deguello",
        "Cantidad",
        "Cant. Machos",
        "Cant. Hembras",
        "Vr. Deguello",
        "Ser. Matadero",
        "Entidad",
        "Total",
      ],
    ])

    // Añadir los datos
    data.data.forEach((item) => {
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            item.Fecha,
            item["G/ Deguello"],
            item.Cantidad,
            item["Cantidad Machos"],
            item["Cantidad Hembras"],
            item["Vr Deguello"],
            item["Ser. Matadero"],
            item.Entidad,
            item.Total,
          ],
        ],
        { origin: -1 },
      )
    })

    // Añadir fila de totales
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          "TOTALES",
          "",
          totales.cantidad.toString(),
          totales.cantidadMachos.toString(),
          totales.cantidadHembras.toString(),
          totales.vrDeguello.toString(),
          totales.serMatadero.toString(),
          "",
          totales.total.toString(),
        ],
      ],
      { origin: -1 },
    )

    // Crear un libro de trabajo y añadir la hoja
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Boletín Movimiento Ganado")

    // Generar el archivo Excel
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    // Devolver el archivo como respuesta
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="boletin_movimiento_ganado_${data.boletinNumber}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    return NextResponse.json({ error: "Error al exportar a Excel" }, { status: 500 })
  }
}
