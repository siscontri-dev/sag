import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDateDMY } from "./date-utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Usar la función de formateo de fecha de la biblioteca de utilidades
export function formatDate(date: string | Date | null | undefined): string {
  return formatDateDMY(date)
}

// Función para formatear números
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
