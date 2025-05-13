import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Función para verificar si un valor es un objeto Date
function isDateObject(value: any): boolean {
  return value instanceof Date && !isNaN(value.getTime())
}

// Función para formatear un objeto Date a string DD/MM/YYYY
function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Función para procesar recursivamente un objeto y convertir todas las fechas a strings
function processObjectDates(obj: any): any {
  if (!obj) return obj

  // Si es un objeto Date, convertirlo a string
  if (isDateObject(obj)) {
    return formatDateToString(obj)
  }

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => processObjectDates(item))
  }

  // Si es un objeto, procesar cada propiedad
  if (typeof obj === "object") {
    const result = { ...obj }

    for (const key in result) {
      // Si el valor es null o undefined, continuar
      if (result[key] === null || result[key] === undefined) {
        continue
      }

      // Si es un objeto Date, convertirlo a string
      if (isDateObject(result[key])) {
        result[key] = formatDateToString(result[key])
      }
      // Si es un objeto o array, procesarlo recursivamente
      else if (typeof result[key] === "object") {
        result[key] = processObjectDates(result[key])
      }
    }

    return result
  }

  // Para cualquier otro tipo de valor, devolverlo sin cambios
  return obj
}

// Middleware para procesar las respuestas de la API
export function middleware(request: NextRequest) {
  // Solo procesar las respuestas de la API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next()

    // Interceptar la respuesta
    response.headers.set("x-middleware-cache", "no-cache")

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
