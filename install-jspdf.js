const { execSync } = require("child_process")

try {
  console.log("Instalando jsPDF y jspdf-autotable...")
  execSync("npm install jspdf jspdf-autotable", { stdio: "inherit" })
  console.log("jsPDF y jspdf-autotable instalados correctamente")
} catch (error) {
  console.error("Error al instalar jsPDF:", error)
  process.exit(1)
}
