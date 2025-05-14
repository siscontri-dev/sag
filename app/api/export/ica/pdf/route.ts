import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, headers, rows, filters } = data
    const tipoAnimal = request.nextUrl.searchParams.get("tipo") || "bovinos"
    const tipoAnimalText = tipoAnimal === "bovinos" ? "BOVINO" : "PORCINO"

    // Crear un nuevo documento PDF en orientación horizontal
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Configurar fuente
    doc.setFont("helvetica", "bold")

    // Agregar título
    doc.setFontSize(16)
    doc.text("CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA", doc.internal.pageSize.width / 2, 20, { align: "center" })

    doc.setFontSize(14)
    doc.text(`Listado Guias ICA, ${tipoAnimalText}`, doc.internal.pageSize.width / 2, 30, { align: "center" })

    // Agregar información de filtros si existen
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    let yPos = 40

    if (filters.dateRange) {
      doc.text(`Período: ${filters.dateRange}`, 14, yPos)
      yPos += 5
    }

    if (filters.searchTerm) {
      doc.text(`Búsqueda: ${filters.searchTerm}`, 14, yPos)
      yPos += 5
    }

    // Agregar fecha de generación
    const currentDate = new Date()
    doc.text(
      `Fecha de generación: ${currentDate.toLocaleDateString("es-CO")} ${currentDate.toLocaleTimeString("es-CO")}`,
      doc.internal.pageSize.width - 14,
      yPos,
      { align: "right" },
    )

    // Preparar datos para la tabla
    const tableHeaders = headers
    const tableData = rows.map((row) => [
      row.guia,
      row.fecha,
      row.propietario,
      row.nit,
      row.machos,
      row.hembras,
      row.totalAnimales,
      row.kilos,
      row.total,
    ])

    // Calcular totales
    let totalMachos = 0
    let totalHembras = 0
    let totalAnimales = 0
    let totalKilos = 0
    let totalValor = 0

    rows.forEach((row) => {
      totalMachos += Number.parseInt(row.machos) || 0
      totalHembras += Number.parseInt(row.hembras) || 0
      totalAnimales += Number.parseInt(row.totalAnimales) || 0
      totalKilos += Number.parseInt(row.kilos) || 0
      totalValor += Number.parseInt(row.total.replace(/[^\d]/g, "")) || 0
    })

    // Agregar fila de totales
    tableData.push([
      "",
      "",
      "TOTALES",
      "",
      totalMachos.toString(),
      totalHembras.toString(),
      totalAnimales.toString(),
      totalKilos.toString(),
      new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalValor),
    ])

    // Generar tabla
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPos + 5,
      theme: "grid",
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: "left" }, // guia
        1: { halign: "left" }, // fecha
        2: { halign: "left" }, // propietario
        3: { halign: "left" }, // nit
        4: { halign: "right" }, // machos
        5: { halign: "right" }, // hembras
        6: { halign: "right" }, // totalAnimales
        7: { halign: "right" }, // kilos
        8: { halign: "right" }, // total
      },
      didDrawPage: (data) => {
        // Pie de página con número de página
        doc.setFontSize(8)
        doc.text(
          `Página ${doc.getCurrentPageInfo().pageNumber} de ${doc.getNumberOfPages()}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" },
        )
      },
      willDrawCell: (data) => {
        // Estilo especial para la fila de totales
        if (data.row.index === tableData.length - 1) {
          doc.setFont("helvetica", "bold")
        }
      },
      didDrawCell: (data) => {
        // Restaurar estilo normal después de dibujar la celda
        if (data.row.index === tableData.length - 1) {
          doc.setFont("helvetica", "normal")
        }
      },
    })

    // Obtener el PDF como array buffer
    const pdfBuffer = doc.output("arraybuffer")

    // Devolver el PDF como respuesta
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=lista_ica_${tipoAnimal}_${new Date().toISOString().split("T")[0]}.pdf`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar el archivo PDF" }, { status: 500 })
  }
}
