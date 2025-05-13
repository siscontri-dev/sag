/**
 * Interceptor para procesar fechas en objetos
 * Esta utilidad convierte automáticamente las fechas en formato ISO a formato DD/MM/YYYY
 * en objetos y arrays de objetos
 */

import { formatDateDMY } from "./date-utils"

/**
 * Procesa un objeto para convertir todas las fechas ISO a formato DD/MM/YYYY
 * @param obj Objeto a procesar
 * @returns Objeto con fechas procesadas
 */
export function processObjectDates<T>(obj: T): T {
  if (!obj) return obj

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDates(item)) as unknown as T
  }

  // Si no es un objeto, devolverlo sin cambios
  if (typeof obj !== "object") {
    return obj
  }

  // Crear una copia del objeto para no modificar el original
  const result = { ...obj }

  // Procesar cada propiedad del objeto
  for (const key in result) {
    const value = result[key]

    // Si la propiedad es un objeto o array, procesarlo recursivamente
    if (value && typeof value === "object") {
      result[key] = processObjectDates(value)
    }
    // Si la propiedad es una cadena que parece una fecha ISO, convertirla
    else if (
      typeof value === "string" &&
      (value.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(value)) &&
      !isNaN(Date.parse(value))
    ) {
      // Verificar si la cadena tiene el formato de fecha ISO
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          // Convertir a formato DD/MM/YYYY
          result[key] = formatDateDMY(date) as any
        }
      } catch (error) {
        console.error(`[date-interceptor] Error al procesar fecha: ${value}`, error)
      }
    }
  }

  return result as T
}

/**
 * Procesa un objeto para convertir todas las fechas en formato DD/MM/YYYY a formato ISO
 * @param obj Objeto a procesar
 * @returns Objeto con fechas procesadas
 */
export function processObjectDatesToISO<T>(obj: T): T {
  if (!obj) return obj

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDatesToISO(item)) as unknown as T
  }

  // Si no es un objeto, devolverlo sin cambios
  if (typeof obj !== "object") {
    return obj
  }

  // Crear una copia del objeto para no modificar el original
  const result = { ...obj }

  // Procesar cada propiedad del objeto
  for (const key in result) {
    const value = result[key]

    // Si la propiedad es un objeto o array, procesarlo recursivamente
    if (value && typeof value === "object") {
      result[key] = processObjectDatesToISO(value)
    }
    // Si la propiedad es una cadena que parece una fecha en formato DD/MM/YYYY, convertirla
    else if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      try {
        // Convertir de DD/MM/YYYY a formato ISO
        const [day, month, year] = value.split("/").map(Number)
        const date = new Date(Date.UTC(year, month - 1, day))
        result[key] = date.toISOString() as any
      } catch (error) {
        console.error(`[date-interceptor] Error al procesar fecha a ISO: ${value}`, error)
      }
    }
  }

  return result as T
}
