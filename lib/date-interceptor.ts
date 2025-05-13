/**
 * Convierte un objeto Date a string en formato DD/MM/YYYY
 */
export function formatDateToDMY(date: Date): string {
  if (!date) return ""

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

/**
 * Verifica si un valor es una fecha válida
 */
export function isValidDate(value: any): boolean {
  if (!value) return false

  // Si ya es un objeto Date
  if (value instanceof Date) {
    return !isNaN(value.getTime())
  }

  // Si es un string, intentar convertirlo a Date
  if (typeof value === "string") {
    // Verificar si parece una fecha en formato ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
      const date = new Date(value)
      return !isNaN(date.getTime())
    }
  }

  return false
}

/**
 * Procesa recursivamente un objeto para convertir todas las fechas a strings
 */
export function processObjectDates(obj: any): any {
  if (!obj) return obj

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDates(item))
  }

  // Si es un objeto Date, convertirlo a string
  if (obj instanceof Date) {
    return formatDateToDMY(obj)
  }

  // Si no es un objeto, devolverlo tal cual
  if (typeof obj !== "object") {
    return obj
  }

  // Procesar cada propiedad del objeto
  const result = { ...obj }
  for (const key in result) {
    const value = result[key]

    // Si el valor es null o undefined, continuar
    if (value == null) continue

    // Si es un objeto Date, convertirlo a string
    if (value instanceof Date) {
      result[key] = formatDateToDMY(value)
      continue
    }

    // Si es un string que parece una fecha ISO, convertirlo
    if (
      typeof value === "string" &&
      (key.includes("fecha") || key.includes("date") || key.includes("created_at") || key.includes("updated_at"))
    ) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          result[key] = formatDateToDMY(date)
        }
      } catch (e) {
        // Si falla la conversión, mantener el valor original
      }
      continue
    }

    // Si es un objeto o array, procesarlo recursivamente
    if (typeof value === "object") {
      result[key] = processObjectDates(value)
    }
  }

  return result
}

/**
 * Formatea una fecha para mostrarla en la UI
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return ""

  try {
    if (typeof date === "string") {
      // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date
      }

      // Intentar convertir a Date
      date = new Date(date)
    }

    if (date instanceof Date) {
      return formatDateToDMY(date)
    }

    // Si no se pudo convertir, devolver como string
    return String(date)
  } catch (error) {
    console.error("Error al formatear fecha para mostrar:", error)
    return String(date)
  }
}
