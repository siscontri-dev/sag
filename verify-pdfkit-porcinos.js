const PDFDocument = require("pdfkit")
const fs = require("fs")

console.log("Verificando instalación de PDFKit...")

try {
  // Crear un nuevo documento PDF
  const doc = new PDFDocument()

  // Crear un stream para escribir el PDF
  const stream = fs.createWriteStream("test-pdfkit-porcinos.pdf")

  // Pipe el PDF al stream
  doc.pipe(stream)

  // Añadir contenido al PDF
  doc.fontSize(25).text("Prueba de PDFKit para Boletín de Porcinos", 100, 100)

  // Finalizar el PDF
  doc.end()

  stream.on("finish", () => {
    console.log("PDF generado correctamente en test-pdfkit-porcinos.pdf")
    console.log("PDFKit está instalado y funcionando correctamente.")
  })

  stream.on("error", (err) => {
    console.error("Error al escribir el PDF:", err)
  })
} catch (error) {
  console.error("Error al crear el PDF:", error)
  console.error("Detalles del error:", error.stack)
}
