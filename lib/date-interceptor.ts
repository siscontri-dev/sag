/**
 * Interceptor para procesar fechas en objetos
 * Este módulo proporciona funciones para procesar fechas en objetos
 * y convertirlas a un formato estándar
 */

import { formatDateDMY } from "./date-utils"

/**
 * Procesa las fechas en un objeto
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
  if (typeof obj !== "object") return obj

  // Crear una copia del objeto para no modificar el original
  const result = { ...obj }

  // Procesar cada propiedad del objeto
  for (const key in result) {
    const value = result[key]

    // Si la propiedad es un objeto, procesarlo recursivamente
    if (value && typeof value === "object") {
      if (value instanceof Date) {
        // Si es un objeto Date, convertirlo a string en formato DD/MM/YYYY
        result[key] = formatDateDMY(value) as any
      } else {
        // Si es otro tipo de objeto, procesarlo recursivamente
        result[key] = processObjectDates(value)
      }
    } else if (typeof value === "string") {
      // Si la propiedad es una cadena, verificar si es una fecha
      if (
        key.toLowerCase().includes("fecha") ||
        key.toLowerCase().includes("date") ||
        key.toLowerCase() === "created_at" ||
        key.toLowerCase() === "updated_at"
      ) {
        // Si la cadena parece ser una fecha, convertirla a formato DD/MM/YYYY
        result[key] = formatDateDMY(value) as any
      }
    }
  }

  return result as T
}

/**
 * Procesa las fechas en un objeto para la base de datos
 * @param obj Objeto a procesar
 * @returns Objeto con fechas procesadas para la base de datos
 */
export function processObjectDatesForDB<T>(obj: T): T {
  if (!obj) return obj

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDatesForDB(item)) as unknown as T
  }

  // Si no es un objeto, devolverlo sin cambios
  if (typeof obj !== "object") return obj

  // Crear una copia del objeto para no modificar el original
  const result = { ...obj }

  // Procesar cada propiedad del objeto
  for (const key in result) {
    const value = result[key]

    // Si la propiedad es un objeto, procesarlo recursivamente
    if (value && typeof value === "object") {
      if (value instanceof Date) {
        // Si es un objeto Date, dejarlo como está para la base de datos
        // No hacer nada, mantener el objeto Date
      } else {
        // Si es otro tipo de objeto, procesarlo recursivamente
        result[key] = processObjectDatesForDB(value)
      }
    } else if (typeof value === "string") {
      // Si la propiedad es una cadena, verificar si es una fecha en formato DD/MM/YYYY
      if (
        (key.toLowerCase().includes("fecha") || key.toLowerCase().includes("date")) &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(value)
      ) {
        // Convertir de DD/MM/YYYY a objeto Date para la base de datos
        const [day, month, year] = value.split("/").map(Number)
        result[key] = new Date(Date.UTC(year, month - 1, day)) as any
      }
    }
  }

  return result as T
}
