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

      // Crear una nueva URL con la misma ruta pero asegurándose de que se maneje como ruta dinámica
      const url = request.nextUrl.clone()

      // No modificar la URL, solo asegurarse de que Next.js la maneje correctamente
      return NextResponse.rewrite(url)
    }
  }

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: [
    "/guias/editar/:path*",
    "/guias/ver/:path*",
    "/sacrificios/editar/:path*",
    "/sacrificios/ver/:path*",
    "/contactos/editar/:path*",
    "/contactos/ver/:path*",
  ],
}
