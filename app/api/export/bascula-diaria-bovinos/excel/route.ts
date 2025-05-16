import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await request.json()
    const { title, headers, rows } = data

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Gestión"
    workbook.lastModifiedBy = "Sistema de Gestión"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Añadir una hoja de trabajo
    const worksheet = workbook.addWorksheet("Báscula Diaria Bovinos")

    // Añadir el título
    const titleRow = worksheet.addRow([title])
    titleRow.font = { bold: true, size: 14 }
    worksheet.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`)
    titleRow.height = 30
    titleRow.alignment = { vertical: "middle", horizontal: "center" }

    // Añadir una fila en blanco
    worksheet.addRow([])

    // Definir las columnas
    worksheet.columns = headers.map((header) => ({
      header,
      key: header.toLowerCase().replace(/\s+/g, "_"),
      width: 15,
    }))

    // Dar formato a la cabecera
    const headerRow = worksheet.getRow(3)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.height = 20

    // Añadir los datos
    rows.forEach((row) => {
      const rowData = [
        row.fecha,
        row.delTicket,
        row.alTicket,
        row.tiquetes,
        row.machos,
        row.hembras,
        row.peso,
        row.valorUnitario,
        row.totalValor,
      ]
      worksheet.addRow(rowData)
    })

    // Dar formato a las columnas numéricas
    const numericColumns = [4, 5, 6, 7, 8, 9] // Tiquetes, Machos, Hembras, Peso, Valor Unitario, Total Valor

    // Aplicar formato a todas las filas de datos
    for (let i = 4; i <= rows.length + 3; i++) {
      // Formato para columnas numéricas
      numericColumns.forEach((colIndex) => {
        const cell = worksheet.getCell(`${String.fromCharCode(64 + colIndex)}${i}`)
        if (colIndex === 8 || colIndex === 9) {
          // Columnas de valores monetarios
          cell.numFmt = '"$"#,##0.00'
        } else {
          cell.numFmt = "#,##0"
        }
        cell.alignment = { horizontal: "right" }
      })
    }

    // Añadir bordes a todas las celdas con datos
    for (let i = 3; i <= rows.length + 3; i++) {
      for (let j = 1; j <= headers.length; j++) {
        const cell = worksheet.getCell(`${String.fromCharCode(64 + j)}${i}`)
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      }
    }

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Devolver el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=bascula_diaria_bovinos_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    })
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    return NextResponse.json({ error: "Error al exportar a Excel" }, { status: 500 })
  }
}
