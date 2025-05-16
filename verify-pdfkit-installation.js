// Verificar la instalación de PDFKit
const PDFDocument = require("pdfkit")

try {
  // Intentar crear un documento PDF
  const doc = new PDFDocument()
  console.log("PDFKit está instalado correctamente.")

  // Verificar que podemos escribir en el documento
  doc.text("Prueba de PDFKit")
  console.log("Se puede escribir en el documento PDF.")

  // Verificar que podemos finalizar el documento
  doc.end()
  console.log("Se puede finalizar el documento PDF.")

  console.log("La verificación de PDFKit ha sido exitosa.")
} catch (error) {
  console.error("Error al verificar PDFKit:", error)
}
