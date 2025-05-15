const fetch = require("node-fetch")

async function checkApiRoute() {
  try {
    console.log("Verificando ruta API de recaudo acumulado diario...")

    // URL de la API
    const apiUrl = "http://localhost:3000/api/informes/recaudo-acumulado-diario"

    console.log(`Realizando solicitud a: ${apiUrl}`)

    // Realizar la solicitud
    const response = await fetch(apiUrl, {
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    console.log(`Código de estado: ${response.status}`)
    console.log(`Tipo de contenido: ${response.headers.get("content-type")}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en la respuesta: ${errorText}`)
      return
    }

    // Verificar el tipo de contenido
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`Tipo de contenido inesperado: ${contentType}`)
      const text = await response.text()
      console.error(`Contenido de la respuesta: ${text.substring(0, 500)}...`)
      return
    }

    // Analizar la respuesta JSON
    const data = await response.json()

    console.log("Respuesta recibida correctamente:")
    console.log(`- Número de registros: ${data.data ? data.data.length : 0}`)
    console.log(`- Usando datos de ejemplo: ${data.usingSampleData ? "Sí" : "No"}`)

    if (data.data && data.data.length > 0) {
      console.log("Primer registro:")
      console.log(data.data[0])
    }

    if (data.totals) {
      console.log("Totales:")
      console.log(data.totals)
    }

    if (data.error) {
      console.log("Error reportado en la respuesta:", data.error)
    }
  } catch (error) {
    console.error("Error al verificar la ruta API:", error)
  }
}

checkApiRoute().catch(console.error)
