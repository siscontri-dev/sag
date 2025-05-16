const fetch = require("node-fetch")

async function testPdfEndpoint() {
  try {
    console.log("Verificando endpoint de PDF para boletín de porcinos...")

    // Datos de prueba
    const testData = {
      title: "Test Boletín Porcinos",
      data: [
        {
          Fecha: "01/05/2025",
          "G/ Deguello": "12345",
          Cantidad: "10",
          "Cantidad Machos": "5",
          "Cantidad Hembras": "5",
          "Vr Deguello": "100000",
          "Ser. Matadero": "50000",
          Porcicultura: "25000",
          Total: "175000",
        },
      ],
      boletinNumber: "TEST-001",
    }

    // Llamar al endpoint
    const response = await fetch("http://localhost:3000/api/export/boletin-movimiento-porcinos/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    })

    console.log("Respuesta del servidor:")
    console.log("Status:", response.status)
    console.log("Content-Type:", response.headers.get("Content-Type"))

    if (response.ok) {
      // Guardar el PDF para verificar
      const buffer = await response.buffer()
      require("fs").writeFileSync("test-api-response.pdf", buffer)

      console.log("Respuesta guardada en test-api-response.pdf")
      console.log("Tamaño del archivo:", buffer.length, "bytes")

      // Verificar si es un PDF válido (los PDFs comienzan con %PDF)
      if (buffer.toString().startsWith("%PDF")) {
        console.log("La respuesta parece ser un PDF válido.")
      } else {
        console.log("ADVERTENCIA: La respuesta no parece ser un PDF válido.")
        console.log("Primeros 100 bytes:", buffer.toString().substring(0, 100))
      }
    } else {
      const text = await response.text()
      console.log("Error en la respuesta:", text)
    }
  } catch (error) {
    console.error("Error al verificar el endpoint:", error)
  }
}

testPdfEndpoint()
