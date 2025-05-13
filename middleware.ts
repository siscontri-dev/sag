import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Log para depuración
  console.log(`Middleware procesando ruta: ${pathname}`)

  // Verificar si es una ruta dinámica que necesita ser manejada
  if (
    pathname.match(/^\/guias\/editar\/\d+$/) ||
    pathname.match(/^\/guias\/ver\/\d+$/) ||
    pathname.match(/^\/sacrificios\/editar\/\d+$/) ||
    pathname.match(/^\/sacrificios\/ver\/\d+$/) ||
    pathname.match(/^\/contactos\/editar\/\d+$/) ||
    pathname.match(/^\/contactos\/ver\/\d+$/)
  ) {
    console.log(`Ruta dinámica detectada: ${pathname}`)

    // Extraer el ID de la URL
    const id = pathname.split("/").pop()

    // Verificar que sea un ID válido
    if (id && !isNaN(Number(id))) {
      console.log(`ID válido: ${id}`)
      return NextResponse.next()
    }
  }

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: [
    "/guias/editar/:id*",
    "/guias/ver/:id*",
    "/sacrificios/editar/:id*",
    "/sacrificios/ver/:id*",
    "/contactos/editar/:id*",
    "/contactos/ver/:id*",
  ],
}
