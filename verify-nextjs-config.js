import fs from "fs"
import path from "path"

function verifyNextJsConfig() {
  try {
    // Verificar next.config.mjs
    const nextConfigPath = path.join(process.cwd(), "next.config.mjs")
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, "utf8")
      console.log("Contenido de next.config.mjs:")
      console.log(nextConfig)

      // Verificar si contiene configuración de zona horaria
      if (nextConfig.includes("timezone")) {
        console.log("✅ La configuración de Next.js incluye configuración de zona horaria.")
      } else {
        console.log("❌ La configuración de Next.js NO incluye configuración de zona horaria.")
      }
    } else {
      console.log("❌ No se encontró el archivo next.config.mjs")
    }

    // Verificar vercel.json
    const vercelConfigPath = path.join(process.cwd(), "vercel.json")
    if (fs.existsSync(vercelConfigPath)) {
      const vercelConfig = fs.readFileSync(vercelConfigPath, "utf8")
      console.log("\nContenido de vercel.json:")
      console.log(vercelConfig)

      // Verificar si contiene configuración de zona horaria
      if (vercelConfig.includes("TZ")) {
        console.log("✅ La configuración de Vercel incluye variable de entorno TZ.")
      } else {
        console.log("❌ La configuración de Vercel NO incluye variable de entorno TZ.")
      }
    } else {
      console.log("❌ No se encontró el archivo vercel.json")
    }
  } catch (error) {
    console.error("Error al verificar la configuración:", error)
  }
}

// Ejecutar la función
verifyNextJsConfig()
