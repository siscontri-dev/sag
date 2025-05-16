import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    const { title, data, boletinNumber, filters } = await request.json()

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema SAG"
    workbook.lastModifiedBy = "Sistema SAG"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Añadir una hoja de trabajo
    const worksheet = workbook.addWorksheet("Boletín Movimiento Porcinos")

    // Configurar columnas con anchos apropiados
    worksheet.columns = [
      { header: "Fecha", key: "fecha", width: 15 },
      { header: "G/ Deguello", key: "deguello", width: 15 },
      { header: "Cantidad", key: "cantidad", width: 12 },
      { header: "Cantidad Machos", key: "cantidadMachos", width: 18 },
      { header: "Cantidad Hembras", key: "cantidadHembras", width: 18 },
      { header: "Vr Deguello", key: "vrDeguello", width: 15 },
      { header: "Ser. Matadero", key: "serMatadero", width: 15 },
      { header: "Porcicultura", key: "porcicultura", width: 15 },
      { header: "Total", key: "total", width: 15 },
    ]

    // Añadir título y subtítulo
    worksheet.mergeCells("A1:I1")
    const titleCell = worksheet.getCell("A1")
    titleCell.value = "CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA"
    titleCell.font = { bold: true, size: 16 }
    titleCell.alignment = { horizontal: "center" }

    worksheet.mergeCells("A2:I2")
    const subtitleCell = worksheet.getCell("A2")
    subtitleCell.value = "BOLETÍN MOVIMIENTO DE PORCINOS"
    subtitleCell.font = { bold: true, size: 14 }
    subtitleCell.alignment = { horizontal: "center" }

    // Añadir número de boletín
    worksheet.mergeCells("A3:I3")
    const boletinCell = worksheet.getCell("A3")
    boletinCell.value = `Boletín No. ${boletinNumber}`
    boletinCell.font = { bold: true, size: 12 }
    boletinCell.alignment = { horizontal: "center" }

    // Añadir información de filtros si existe
    let currentRow = 4
    if (filters.dateRange) {
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
      const filterCell = worksheet.getCell(`A${currentRow}`)
      filterCell.value = `Período: ${filters.dateRange}`
      filterCell.font = { italic: true, size: 10 }
      filterCell.alignment = { horizontal: "center" }
      currentRow++
    }

    if (filters.searchTerm) {
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`)
      const filterCell = worksheet.getCell(`A${currentRow}`)
      filterCell.value = `Búsqueda: ${filters.searchTerm}`
      filterCell.font = { italic: true, size: 10 }
      filterCell.alignment = { horizontal: "center" }
      currentRow++
    }

    // Añadir espacio antes de la tabla
    currentRow++

    // Establecer la fila de encabezados
    const headerRow = worksheet.getRow(currentRow)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    }
    headerRow.alignment = { horizontal: "center" }

    // Añadir los encabezados
    worksheet.columns.forEach((column, index) => {
      headerRow.getCell(index + 1).value = column.header
    })

    currentRow++

    // Añadir los datos
    let totalCantidad = 0
    let totalCantidadMachos = 0
    let totalCantidadHembras = 0
    let totalVrDeguello = 0
    let totalSerMatadero = 0
    let totalPorcicultura = 0
    let totalTotal = 0

    data.forEach((item) => {
      const row = worksheet.addRow({
        fecha: item.Fecha,
        deguello: item["G/ Deguello"],
        cantidad: item.Cantidad,
        cantidadMachos: item["Cantidad Machos"],
        cantidadHembras: item["Cantidad Hembras"],
        vrDeguello: item["Vr Deguello"],
        serMatadero: item["Ser. Matadero"],
        porcicultura: item.Porcicultura,
        total: item.Total,
      })

      // Alinear las celdas
      row.getCell(1).alignment = { horizontal: "left" }
      row.getCell(2).alignment = { horizontal: "left" }
      for (let i = 3; i <= 9; i++) {
        row.getCell(i).alignment = { horizontal: "right" }
      }

      // Acumular totales
      totalCantidad += Number.parseInt(item.Cantidad.replace(/,/g, "") || "0")
      totalCantidadMachos += Number.parseInt(item["Cantidad Machos"].replace(/,/g, "") || "0")
      totalCantidadHembras += Number.parseInt(item["Cantidad Hembras"].replace(/,/g, "") || "0")
      totalVrDeguello += Number.parseInt(item["Vr Deguello"].replace(/,/g, "") || "0")
      totalSerMatadero += Number.parseInt(item["Ser. Matadero"].replace(/,/g, "") || "0")
      totalPorcicultura += Number.parseInt(item.Porcicultura.replace(/,/g, "") || "0")
      totalTotal += Number.parseInt(item.Total.replace(/,/g, "") || "0")

      currentRow++
    })

    // Añadir fila de totales
    const totalsRow = worksheet.addRow({
      fecha: "TOTALES",
      deguello: "",
      cantidad: totalCantidad.toLocaleString(),
      cantidadMachos: totalCantidadMachos.toLocaleString(),
      cantidadHembras: totalCantidadHembras.toLocaleString(),
      vrDeguello: totalVrDeguello.toLocaleString(),
      serMatadero: totalSerMatadero.toLocaleString(),
      porcicultura: totalPorcicultura.toLocaleString(),
      total: totalTotal.toLocaleString(),
    })

    // Dar formato a la fila de totales
    totalsRow.font = { bold: true }
    totalsRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }
    totalsRow.getCell(1).alignment = { horizontal: "right" }
    for (let i = 3; i <= 9; i++) {
      totalsRow.getCell(i).alignment = { horizontal: "right" }
    }

    // Añadir bordes a todas las celdas de la tabla
    for (let i = currentRow - data.length; i <= currentRow; i++) {
      const row = worksheet.getRow(i)
      for (let j = 1; j <= 9; j++) {
        const cell = row.getCell(j)
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: i === currentRow ? "double" : "thin" },
          right: { style: "thin" },
        }
      }
    }

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Devolver la respuesta con el archivo Excel
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="boletin_movimiento_porcinos_${boletinNumber}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Error al generar Excel:", error)
    return NextResponse.json({ error: "Error al generar el archivo Excel" }, { status: 500 })
  }
}
