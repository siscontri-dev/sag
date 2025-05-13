/**
 * Función para procesar fechas en objetos y convertirlas a strings en formato DD/MM/YYYY
 * @param obj Objeto o array que puede contener fechas
 * @returns El mismo objeto con todas las fechas convertidas a strings
 */
export function processObjectDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Si es un objeto Date, convertirlo a string en formato DD/MM/YYYY
  if (obj instanceof Date) {
    return formatDateToDMY(obj)
  }

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDates(item))
  }

  // Si es un objeto, procesar cada propiedad
  if (typeof obj === "object") {
    const result = { ...obj }

    for (const key in result) {
      // Verificar si la propiedad parece ser una fecha
      if (
        result[key] instanceof Date ||
        (typeof result[key] === "string" && isDateString(result[key])) ||
        key.includes("fecha") ||
        key.includes("date") ||
        key.includes("created_at") ||
        key.includes("updated_at")
      ) {
        try {
          // Intentar convertir a fecha y luego a string en formato DD/MM/YYYY
          if (result[key] !== null && result[key] !== undefined) {
            const dateValue = result[key] instanceof Date ? result[key] : new Date(result[key])

            // Verificar si la fecha es válida
            if (!isNaN(dateValue.getTime())) {
              result[key] = formatDateToDMY(dateValue)
            }
          }
        } catch (error) {
          console.warn(`Error al procesar fecha en propiedad ${key}:`, error)
        }
      } else if (typeof result[key] === "object" && result[key] !== null) {
        // Procesar recursivamente objetos anidados
        result[key] = processObjectDates(result[key])
      }
    }

    return result
  }

  // Si no es un objeto, array o Date, devolverlo sin cambios
  return obj
}

/**
 * Verifica si una cadena parece ser una fecha
 * @param str Cadena a verificar
 * @returns true si la cadena parece ser una fecha
 */
function isDateString(str: string): boolean {
  if (typeof str !== "string") return false

  // Patrones comunes de fechas
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}/, // ISO date: 2023-01-31
    /^\d{2}\/\d{2}\/\d{4}/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
    /^\d{4}\/\d{2}\/\d{2}/, // YYYY/MM/DD
    /^\d{2}\.\d{2}\.\d{4}/, // DD.MM.YYYY
  ]

  return datePatterns.some((pattern) => pattern.test(str)) && !isNaN(new Date(str).getTime())
}

/**
 * Formatea una fecha a string en formato DD/MM/YYYY
 * @param date Fecha a formatear
 * @returns String en formato DD/MM/YYYY
 */
function formatDateToDMY(date: Date): string {
  try {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return String(date)
  }
}
