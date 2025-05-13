import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ""

  try {
    // Si es string, intentar diferentes formatos
    let dateObj: Date

    if (typeof date === "string") {
      // Verificar si la fecha ya tiene el formato correcto (DD/MM/YYYY)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split("/").map(Number)
        dateObj = new Date(year, month - 1, day)
      }
      // Verificar si es formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
      else if (date.includes("T")) {
        dateObj = new Date(date)
      }
      // Verificar si es formato YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number)
        dateObj = new Date(year, month - 1, day)
      }
      // Otros formatos
      else {
        dateObj = new Date(date)
      }
    } else {
      dateObj = date
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn(`Fecha inválida: ${date}`)
      return ""
    }

    // Usar el formato DD/MM/YYYY para Colombia
    return dateObj.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch (error) {
    console.error(`Error al formatear fecha: ${date}`, error)
    return ""
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
