import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, headers, rows, filters } = data

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
    doc.text("Báscula Diaria - Bovinos", doc.internal.pageSize.width / 2, 30, { align: "center" })

    // Agregar información de filtros si existen
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    let yPos = 40

    if (filters?.dateRange) {
      doc.text(`Período: ${filters.dateRange}`, 14, yPos)
      yPos += 5
    }

    if (filters?.searchTerm) {
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
      row.fecha,
      row.delTicket,
      row.alTicket,
      row.tiquetes,
      row.machos,
      row.hembras,
      row.peso,
      row.valorUnitario,
      row.totalValor,
    ])

    // Calcular totales
    let totalTiquetes = 0
    let totalMachos = 0
    let totalHembras = 0
    let totalPeso = 0
    let totalValorServicio = 0

    rows.forEach((row) => {
      totalTiquetes += Number.parseInt(row.tiquetes.replace(/[^\d]/g, "")) || 0
      totalMachos += Number.parseInt(row.machos.replace(/[^\d]/g, "")) || 0
      totalHembras += Number.parseInt(row.hembras.replace(/[^\d]/g, "")) || 0
      totalPeso += Number.parseInt(row.peso.replace(/[^\d]/g, "")) || 0
      totalValorServicio += Number.parseInt(row.totalValor.replace(/[^\d]/g, "")) || 0
    })

    // Calcular valor unitario promedio
    const valorUnitarioPromedio = totalTiquetes > 0 ? totalValorServicio / totalTiquetes : 0

    // Agregar fila de totales
    tableData.push([
      "TOTALES",
      "",
      "",
      totalTiquetes.toString(),
      totalMachos.toString(),
      totalHembras.toString(),
      totalPeso.toString(),
      new Intl.NumberFormat("es-CO").format(valorUnitarioPromedio),
      new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(totalValorServicio),
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
        0: { halign: "left" }, // fecha
        1: { halign: "right" }, // del ticket
        2: { halign: "right" }, // al ticket
        3: { halign: "right" }, // tiquetes
        4: { halign: "right" }, // machos
        5: { halign: "right" }, // hembras
        6: { halign: "right" }, // peso
        7: { halign: "right" }, // valor unitario
        8: { halign: "right" }, // total valor
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
        "Content-Disposition": `attachment; filename=bascula_diaria_bovinos_${new Date().toISOString().split("T")[0]}.pdf`,
      },
    })
  } catch (error) {
    console.error("Error al generar PDF:", error)
    return NextResponse.json({ error: "Error al generar el archivo PDF" }, { status: 500 })
  }
}
