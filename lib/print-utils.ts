// Utilidades para impresión de tickets

// Función para formatear la fecha y hora actual
export function getCurrentDateTime(): string {
  const now = new Date()
  return now.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Función para centrar texto en un ancho específico
export function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  const spaces = width - text.length
  const leftSpaces = Math.floor(spaces / 2)
  return " ".repeat(leftSpaces) + text
}

// Función para alinear texto a la derecha
export function rightAlign(text: string, width: number): string {
  if (text.length >= width) return text
  const spaces = width - text.length
  return " ".repeat(spaces) + text
}

// Función para crear una línea de separación
export function createSeparator(width: number, char = "-"): string {
  return char.repeat(width)
}

// Función para formatear dos columnas de texto
export function formatTwoColumns(left: string, right: string, width: number): string {
  const spaces = width - left.length - right.length
  if (spaces <= 0) return left + right
  return left + " ".repeat(spaces) + right
}

// Función para formatear tres columnas de texto
export function formatThreeColumns(left: string, middle: string, right: string, width: number): string {
  // Calcular el espacio disponible
  const contentLength = left.length + middle.length + right.length
  const totalSpaces = width - contentLength

  if (totalSpaces <= 0) return left + middle + right

  // Distribuir espacios entre las columnas
  const leftSpaces = Math.floor(totalSpaces / 2)
  const rightSpaces = totalSpaces - leftSpaces

  return left + " ".repeat(leftSpaces) + middle + " ".repeat(rightSpaces) + right
}
