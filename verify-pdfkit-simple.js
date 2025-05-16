const PDFDocument = require("pdfkit")
const fs = require("fs")

console.log("Verificando instalación de PDFKit...")

try {
  // Crear un documento PDF simple
  const doc = new PDFDocument()
  const outputStream = fs.createWriteStream("test-pdfkit.pdf")

  // Manejar eventos de stream
  outputStream.on("finish", () => {
    console.log("✅ PDF generado correctamente. Verificar archivo test-pdfkit.pdf")
  })

  outputStream.on("error", (err) => {
    console.error("❌ Error al escribir el archivo PDF:", err)
  })

  // Pipe el PDF al archivo
  doc.pipe(outputStream)

  // Añadir contenido simple
  doc.fontSize(25).text("Prueba de PDFKit", 100, 100)
  doc.fontSize(12).text("Este es un PDF de prueba para verificar que PDFKit está funcionando correctamente.", 100, 150)

  // Finalizar el documento
  doc.end()

  console.log("✅ PDFKit está instalado correctamente.")
} catch (error) {
  console.error("❌ Error al verificar PDFKit:", error)
}
