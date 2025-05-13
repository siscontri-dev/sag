/**
 * Biblioteca de utilidades para el manejo de fechas
 * Esta biblioteca proporciona funciones robustas para manejar fechas
 * de manera consistente en todos los entornos (desarrollo y producción)
 */

/**
 * Normaliza una fecha en cualquier formato a un objeto Date estándar
 * @param date Fecha en cualquier formato (string, Date, null, undefined)
 * @returns Objeto Date normalizado o null si la fecha es inválida
 */
export function normalizeDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null

  try {
    let dateObj: Date

    if (typeof date === "string") {
      // Formato DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split("/").map(Number)
        dateObj = new Date(year, month - 1, day, 12, 0, 0)
      }
      // Formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
      else if (date.includes("T")) {
        dateObj = new Date(date)
      }
      // Formato YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number)
        dateObj = new Date(year, month - 1, day, 12, 0, 0)
      }
      // Otros formatos
      else {
        dateObj = new Date(date)
      }
    } else {
      dateObj = new Date(date)
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn(`[date-utils] Fecha inválida: ${date}`)
      return null
    }

    return dateObj
  } catch (error) {
    console.error(`[date-utils] Error al normalizar fecha: ${date}`, error)
    return null
  }
}

/**
 * Formatea una fecha a un string en formato DD/MM/YYYY
 * @param date Fecha en cualquier formato (string, Date, null, undefined)
 * @returns String en formato DD/MM/YYYY o cadena vacía si la fecha es inválida
 */
export function formatDateDMY(date: string | Date | null | undefined): string {
  const dateObj = normalizeDate(date)
  if (!dateObj) return ""

  // Formatear manualmente para evitar problemas de locale
  const day = String(dateObj.getDate()).padStart(2, "0")
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const year = dateObj.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Formatea una fecha a un string en formato YYYY-MM-DD (para inputs HTML)
 * @param date Fecha en cualquier formato (string, Date, null, undefined)
 * @returns String en formato YYYY-MM-DD o cadena vacía si la fecha es inválida
 */
export function formatDateYMD(date: string | Date | null | undefined): string {
  const dateObj = normalizeDate(date)
  if (!dateObj) return ""

  // Formatear manualmente para evitar problemas de locale
  const day = String(dateObj.getDate()).padStart(2, "0")
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const year = dateObj.getFullYear()

  return `${year}-${month}-${day}`
}

/**
 * Compara dos fechas ignorando la hora
 * @param date1 Primera fecha
 * @param date2 Segunda fecha
 * @returns -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export function compareDates(date1: string | Date | null | undefined, date2: string | Date | null | undefined): number {
  const d1 = normalizeDate(date1)
  const d2 = normalizeDate(date2)

  if (!d1 && !d2) return 0
  if (!d1) return -1
  if (!d2) return 1

  // Normalizar a solo fecha (sin hora)
  const date1Normalized = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const date2Normalized = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate())

  // Comparar timestamps
  const t1 = date1Normalized.getTime()
  const t2 = date2Normalized.getTime()

  if (t1 < t2) return -1
  if (t1 > t2) return 1
  return 0
}

/**
 * Verifica si una fecha está dentro de un rango (inclusive)
 * @param date Fecha a verificar
 * @param startDate Fecha de inicio del rango
 * @param endDate Fecha de fin del rango
 * @returns true si la fecha está dentro del rango, false en caso contrario
 */
export function isDateInRange(
  date: string | Date | null | undefined,
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): boolean {
  if (!date) return false

  const dateObj = normalizeDate(date)
  const startObj = normalizeDate(startDate)
  const endObj = normalizeDate(endDate)

  if (!dateObj) return false

  // Si no hay fecha de inicio, solo verificar contra la fecha de fin
  if (!startObj && endObj) {
    return compareDates(dateObj, endObj) <= 0
  }

  // Si no hay fecha de fin, solo verificar contra la fecha de inicio
  if (startObj && !endObj) {
    return compareDates(dateObj, startObj) >= 0
  }

  // Si hay ambas fechas, verificar que esté dentro del rango
  if (startObj && endObj) {
    return compareDates(dateObj, startObj) >= 0 && compareDates(dateObj, endObj) <= 0
  }

  // Si no hay fechas de rango, siempre es verdadero
  return true
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns String en formato YYYY-MM-DD
 */
export function getCurrentDateYMD(): string {
  return formatDateYMD(new Date())
}

/**
 * Obtiene la fecha actual en formato DD/MM/YYYY
 * @returns String en formato DD/MM/YYYY
 */
export function getCurrentDateDMY(): string {
  return formatDateDMY(new Date())
}

/**
 * Obtiene la fecha de ayer en formato YYYY-MM-DD
 * @returns String en formato YYYY-MM-DD
 */
export function getYesterdayDateYMD(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateYMD(yesterday)
}

/**
 * Obtiene la fecha de ayer en formato DD/MM/YYYY
 * @returns String en formato DD/MM/YYYY
 */
export function getYesterdayDateDMY(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateDMY(yesterday)
}

/**
 * Registra información detallada sobre una fecha para depuración
 * @param label Etiqueta para identificar la fecha
 * @param date Fecha a depurar
 */
export function debugDate(label: string, date: string | Date | null | undefined): void {
  if (!date) {
    console.log(`[DEBUG] ${label}: null o undefined`)
    return
  }

  const dateObj = typeof date === "string" ? new Date(date) : date

  console.log(`[DEBUG] ${label}:`)
  console.log(`  Original: ${date}`)
  console.log(`  Tipo: ${typeof date}`)
  console.log(`  Objeto Date: ${dateObj}`)
  console.log(`  getTime(): ${dateObj.getTime()}`)
  console.log(`  toISOString(): ${dateObj.toISOString()}`)
  console.log(`  toLocaleDateString(): ${dateObj.toLocaleDateString()}`)
  console.log(`  Normalizado: ${formatDateDMY(date)}`)
}

/**
 * Formatea un número para mostrarlo con separadores de miles
 * @param value Número a formatear
 * @returns String con el número formateado
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
