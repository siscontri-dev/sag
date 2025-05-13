// Agregar o modificar la función para formatear fechas usando la zona horaria de Bogotá, Colombia
export function formatDateDMY(date: string | Date | null | undefined): string {
  if (!date) return ""

  // Crear un objeto Date a partir del valor proporcionado
  const dateObj = typeof date === "string" ? new Date(date) : date

  // Formatear la fecha usando la zona horaria de Bogotá, Colombia (UTC-5)
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(dateObj)
}

// Asegurar que todas las funciones de formateo de fecha usen la zona horaria correcta
export function formatDate(date: string | Date | null | undefined): string {
  return formatDateDMY(date)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date) : date

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Bogota",
  }).format(dateObj)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  return value.toLocaleString("es-CO")
}
