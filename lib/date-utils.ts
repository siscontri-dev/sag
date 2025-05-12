/**
 * Utilidades para manejar fechas en la zona horaria de Bogotá, Colombia (UTC-5)
 */

// Zona horaria de Bogotá, Colombia
const BOGOTA_TIMEZONE = "America/Bogota"

/**
 * Obtiene la fecha actual en la zona horaria de Bogotá
 * @returns Fecha actual en Bogotá
 */
export function getCurrentDateBogota(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BOGOTA_TIMEZONE }))
}

/**
 * Formatea una fecha para mostrarla en formato DD/MM/YYYY
 * @param date Fecha a formatear
 * @returns Fecha formateada
 */
export function formatDateBogota(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("es-CO", {
    timeZone: BOGOTA_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/**
 * Convierte una fecha a formato ISO para formularios (YYYY-MM-DD)
 * @param date Fecha a convertir
 * @returns Fecha en formato ISO
 */
export function toISODateBogota(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const bogotaDate = new Date(dateObj.toLocaleString("en-US", { timeZone: BOGOTA_TIMEZONE }))

  const year = bogotaDate.getFullYear()
  const month = String(bogotaDate.getMonth() + 1).padStart(2, "0")
  const day = String(bogotaDate.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Normaliza una fecha para asegurarse de que esté en la zona horaria de Bogotá
 * @param dateString Cadena de fecha (puede ser en formato ISO o cualquier formato válido)
 * @returns Fecha normalizada en formato ISO (YYYY-MM-DD)
 */
export function normalizeDateBogota(dateString: string): string {
  // Si la fecha ya está en formato ISO (YYYY-MM-DD), la devolvemos tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Si no, convertimos la fecha a un objeto Date y luego a formato ISO
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    // Si la fecha no es válida, devolvemos la fecha actual
    console.warn(`Fecha inválida: ${dateString}, usando fecha actual`)
    return toISODateBogota(new Date())
  }

  return toISODateBogota(date)
}
