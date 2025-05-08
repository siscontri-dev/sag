import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")

    // Consulta para obtener los sacrificios
    let query = `
      SELECT 
        t.id, 
        t.numero_documento, 
        t.fecha_documento, 
        c1.primer_nombre || ' ' || c1.primer_apellido AS dueno_anterior_nombre,
        c1.nit AS dueno_anterior_nit,
        c2.primer_nombre || ' ' || c2.primer_apellido AS dueno_nuevo_nombre,
        c2.nit AS dueno_nuevo_nit,
        t.quantity_m, 
        t.quantity_h, 
        t.quantity_k,
        t.impuesto1,
        t.impuesto2,
        t.impuesto3,
        t.total,
        t.estado,
        t.colors,
        t.consignante,
        t.planilla
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE t.type = 'exit'
    `

    if (tipo) {
      const locationId = tipo === "bovino" ? 1 : 2
      query += ` AND t.business_location_id = ${locationId}`
    }

    query += ` ORDER BY t.fecha_documento DESC`

    const result = await sql.query(query)
    const sacrificios = result.rows

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Sistema de Gestión"
    workbook.lastModifiedBy = "Sistema de Gestión"
    workbook.created = new Date()
    workbook.modified = new Date()

    // Añadir una hoja de trabajo
    const worksheet = workbook.addWorksheet("Sacrificios")

    // Actualizar la exportación a Excel para incluir los nuevos campos
    // Definir las columnas
    worksheet.columns = [
      { header: "Número", key: "numero_documento", width: 15 },
      { header: "Fecha", key: "fecha_documento", width: 15 },
      { header: "Dueño Anterior", key: "dueno_anterior_nombre", width: 25 },
      { header: "NIT Anterior", key: "dueno_anterior_nit", width: 15 },
      { header: "Dueño Nuevo", key: "dueno_nuevo_nombre", width: 25 },
      { header: "NIT Nuevo", key: "dueno_nuevo_nit", width: 15 },
      { header: "Consignante", key: "consignante", width: 25 },
      { header: "Planilla", key: "planilla", width: 15 },
      { header: "Machos", key: "quantity_m", width: 10 },
      { header: "Hembras", key: "quantity_h", width: 10 },
      { header: "Total M+H", key: "total_animales", width: 10 },
      { header: "Kilos", key: "quantity_k", width: 10 },
      { header: "Degüello", key: "impuesto1", width: 15 },
      { header: "Fondo", key: "impuesto2", width: 15 },
      { header: "Matadero", key: "impuesto3", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Colores", key: "colors", width: 20 },
    ]

    // Dar formato a la cabecera
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    }

    // Añadir los datos
    sacrificios.forEach((sacrificio) => {
      // Calcular el total de animales
      const totalAnimales = (sacrificio.quantity_m || 0) + (sacrificio.quantity_h || 0)

      worksheet.addRow({
        ...sacrificio,
        fecha_documento: new Date(sacrificio.fecha_documento).toLocaleDateString("es-CO"),
        total_animales: totalAnimales,
        // Formatear el estado
        estado:
          sacrificio.estado === "confirmado" ? "Confirmado" : sacrificio.estado === "anulado" ? "Anulado" : "Borrador",
      })
    })

    // Dar formato a las columnas numéricas
    const numericColumns = ["quantity_m", "quantity_h", "total_animales", "quantity_k"]
    const moneyColumns = ["impuesto1", "impuesto2", "impuesto3", "total"]

    // Aplicar formato a todas las filas
    for (let i = 2; i <= sacrificios.length + 1; i++) {
      // Formato para columnas numéricas
      numericColumns.forEach((col) => {
        const cell = worksheet.getCell(`${getColumnLetter(worksheet, col)}${i}`)
        cell.numFmt = "#,##0"
      })

      // Formato para columnas de dinero
      moneyColumns.forEach((col) => {
        const cell = worksheet.getCell(`${getColumnLetter(worksheet, col)}${i}`)
        cell.numFmt = "$#,##0.00"
      })
    }

    // Generar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer()

    // Devolver el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=guias_deguello_${tipo || "todos"}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`,
      },
    })
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    return NextResponse.json({ error: "Error al exportar a Excel" }, { status: 500 })
  }
}

// Función auxiliar para obtener la letra de la columna por su clave
function getColumnLetter(worksheet, key) {
  const column = worksheet.columns.find((col) => col.key === key)
  if (!column) return "A"
  const index = worksheet.columns.indexOf(column)
  return String.fromCharCode(65 + index) // A=65, B=66, etc.
}
