const { execSync } = require("child_process")

try {
  console.log("Instalando PDFKit...")
  execSync("npm install pdfkit @types/pdfkit", { stdio: "inherit" })
  console.log("PDFKit instalado correctamente")
} catch (error) {
  console.error("Error al instalar PDFKit:", error)
  process.exit(1)
}
