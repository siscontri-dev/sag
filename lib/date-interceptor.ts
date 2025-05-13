/**
 * Función para procesar fechas en objetos
 * Convierte fechas en formato ISO a formato DD/MM/YYYY
 */
export function processObjectDates(obj: any): any {
  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDates(item))
  }

  // Si no es un objeto o es null, devolverlo sin cambios
  if (obj === null || typeof obj !== "object") {
    return obj
  }

  // Crear una copia del objeto para no modificar el original
  const result = { ...obj }

  // Procesar cada propiedad del objeto
  for (const key in result) {
    const value = result[key]

    // Si la propiedad contiene la palabra "fecha" y es un string que parece una fecha
    if (
      (key.toLowerCase().includes("fecha") || key.toLowerCase() === "date") &&
      typeof value === "string" &&
      (value.includes("T") || value.includes("-"))
    ) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          // Formatear como DD/MM/YYYY
          const day = String(date.getDate()).padStart(2, "0")
          const month = String(date.getMonth() + 1).padStart(2, "0")
          const year = date.getFullYear()
          result[key] = `${day}/${month}/${year}`
        }
      } catch (error) {
        console.error(`Error al procesar fecha ${key}: ${value}`, error)
      }
    }
    // Si es un objeto o array, procesarlo recursivamente
    else if (typeof value === "object" && value !== null) {
      result[key] = processObjectDates(value)
    }
  }

  return result
}
