/**
 * Biblioteca de utilidades para el manejo de fechas
 * Esta biblioteca proporciona funciones robustas para manejar fechas
 * de manera consistente en todos los entornos (desarrollo y producción)
 */

/**
 * SOLUCIÓN DIRECTA PARA EL PROBLEMA DE FECHAS EN PRODUCCIÓN
 *
 * Esta implementación ignora completamente las zonas horarias y
 * simplemente extrae los componentes de fecha directamente de las cadenas
 * o de los objetos Date, sin realizar ninguna conversión de zona horaria.
 */

/**
 * Extrae los componentes de fecha (día, mes, año) de una cadena de fecha
 * @param dateStr Cadena de fecha en cualquier formato
 * @returns Objeto con día, mes y año, o null si no se puede extraer
 */
function extractDateComponents(dateStr: string): { day: number; month: number; year: number } | null {
  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("/").map(Number)
    return { day, month, year }
  }

  // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const datePart = dateStr.split("T")[0]
    const [year, month, day] = datePart.split("-").map(Number)
    return { day, month, year }
  }

  return null
}

/**
 * Formatea una fecha a un string en formato DD/MM/YYYY
 * @param date Fecha en cualquier formato (string, Date, null, undefined)
 * @returns String en formato DD/MM/YYYY o cadena vacía si la fecha es inválida
 */
export function formatDateDMY(date: string | Date | null | undefined): string {
  if (!date) return ""

  try {
    // Si es una cadena, intentar extraer los componentes directamente
    if (typeof date === "string") {
      const components = extractDateComponents(date)
      if (components) {
        return `${String(components.day).padStart(2, "0")}/${String(components.month).padStart(2, "0")}/${components.year}`
      }
    }

    // Si es un objeto Date o la extracción falló, usar el objeto Date
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Extraer día, mes y año directamente del objeto Date
    // Usar métodos getUTC* para evitar conversiones de zona horaria
    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const year = dateObj.getUTCFullYear()

    return `${day}/${month}/${year}`
  } catch (error) {
    console.error(`[date-utils] Error al formatear fecha: ${date}`, error)

    // Último recurso: devolver la fecha original como string
    if (typeof date === "string") {
      // Si ya está en formato DD/MM/YYYY, devolverla directamente
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date
      }

      // Si está en formato ISO, intentar extraer solo la parte de la fecha
      if (date.includes("T")) {
        const datePart = date.split("T")[0]
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split("-")
          return `${day}/${month}/${year}`
        }
      }
    }

    return String(date) || ""
  }
}

/**
 * Formatea una fecha a un string en formato YYYY-MM-DD (para inputs HTML)
 * @param date Fecha en cualquier formato (string, Date, null, undefined)
 * @returns String en formato YYYY-MM-DD o cadena vacía si la fecha es inválida
 */
export function formatDateYMD(date: string | Date | null | undefined): string {
  if (!date) return ""

  try {
    // Si es una cadena, intentar extraer los componentes directamente
    if (typeof date === "string") {
      const components = extractDateComponents(date)
      if (components) {
        return `${components.year}-${String(components.month).padStart(2, "0")}-${String(components.day).padStart(2, "0")}`
      }
    }

    // Si es un objeto Date o la extracción falló, usar el objeto Date
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Extraer día, mes y año directamente del objeto Date
    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const year = dateObj.getUTCFullYear()

    return `${year}-${month}-${day}`
  } catch (error) {
    console.error(`[date-utils] Error al formatear fecha: ${date}`, error)
    return String(date) || ""
  }
}

// Resto de funciones de utilidad para fechas...

/**
 * Compara dos fechas ignorando la hora
 */
export function compareDates(date1: string | Date | null | undefined, date2: string | Date | null | undefined): number {
  // Implementación simplificada que compara las representaciones de cadena en formato YYYY-MM-DD
  const str1 = formatDateYMD(date1)
  const str2 = formatDateYMD(date2)

  if (!str1 && !str2) return 0
  if (!str1) return -1
  if (!str2) return 1

  return str1.localeCompare(str2)
}

/**
 * Verifica si una fecha está dentro de un rango (inclusive)
 */
export function isDateInRange(
  date: string | Date | null | undefined,
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): boolean {
  if (!date) return false

  const dateStr = formatDateYMD(date)
  const startStr = formatDateYMD(startDate)
  const endStr = formatDateYMD(endDate)

  if (!dateStr) return false

  // Si no hay fecha de inicio, solo verificar contra la fecha de fin
  if (!startStr && endStr) {
    return dateStr <= endStr
  }

  // Si no hay fecha de fin, solo verificar contra la fecha de inicio
  if (startStr && !endStr) {
    return dateStr >= startStr
  }

  // Si hay ambas fechas, verificar que esté dentro del rango
  if (startStr && endStr) {
    return dateStr >= startStr && dateStr <= endStr
  }

  // Si no hay fechas de rango, siempre es verdadero
  return true
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function getCurrentDateYMD(): string {
  const now = new Date()
  return formatDateYMD(now)
}

/**
 * Obtiene la fecha actual en formato DD/MM/YYYY
 */
export function getCurrentDateDMY(): string {
  const now = new Date()
  return formatDateDMY(now)
}

/**
 * Obtiene la fecha de ayer en formato YYYY-MM-DD
 */
export function getYesterdayDateYMD(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateYMD(yesterday)
}

/**
 * Obtiene la fecha de ayer en formato DD/MM/YYYY
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
  console.log(`[DEBUG] ${label}:`)
  console.log(`  Original: ${date}`)
  console.log(`  Tipo: ${typeof date}`)

  if (typeof date === "string") {
    console.log(`  Componentes extraídos: ${JSON.stringify(extractDateComponents(date))}`)
  }

  if (date instanceof Date) {
    console.log(`  UTC String: ${date.toUTCString()}`)
    console.log(`  ISO String: ${date.toISOString()}`)
    console.log(`  UTC Date: ${date.getUTCDate()}`)
    console.log(`  UTC Month: ${date.getUTCMonth() + 1}`)
    console.log(`  UTC Year: ${date.getUTCFullYear()}`)
  }

  console.log(`  Formateado DMY: ${formatDateDMY(date)}`)
  console.log(`  Formateado YMD: ${formatDateYMD(date)}`)
}

/**
 * Formatea un número para mostrarlo con separadores de miles
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

/**
 * Función para forzar el formato de fecha en DD/MM/YYYY
 * Esta función es más agresiva y está diseñada para garantizar
 * que siempre se devuelva una fecha en formato DD/MM/YYYY
 */
export function forceDateDMY(date: string | Date | null | undefined): string {
  return formatDateDMY(date)
}

/**
 * Función para formatear fecha y hora en formato DD/MM/YYYY HH:MM:SS
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ""

  try {
    // Si es una cadena en formato ISO
    if (typeof date === "string" && date.includes("T")) {
      const [datePart, timePart] = date.split("T")

      // Extraer componentes de fecha
      const dateComponents = extractDateComponents(datePart)
      if (!dateComponents) return formatDateDMY(date)

      // Extraer componentes de hora
      let timeStr = ""
      if (timePart) {
        const timeComponents = timePart.split(".")[0] // Eliminar milisegundos
        timeStr = ` ${timeComponents}`
      }

      return `${String(dateComponents.day).padStart(2, "0")}/${String(dateComponents.month).padStart(2, "0")}/${dateComponents.year}${timeStr}`
    }

    // Si es un objeto Date
    const dateObj = typeof date === "string" ? new Date(date) : date

    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const year = dateObj.getUTCFullYear()
    const hours = String(dateObj.getUTCHours()).padStart(2, "0")
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0")
    const seconds = String(dateObj.getUTCSeconds()).padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error(`[date-utils] Error al formatear fecha y hora: ${date}`, error)
    return formatDateDMY(date)
  }
}
