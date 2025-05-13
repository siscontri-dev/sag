"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft, PenToolIcon as Tool } from "lucide-react"

export default function NotFound() {
  // Extraer el ID de la URL si es una página de guía
  const getGuiaIdFromUrl = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      const match = path.match(/\/guias\/(?:editar|ver)\/(\d+)/)
      return match ? match[1] : null
    }
    return null
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Página no encontrada</h1>
          <p className="mt-2 text-lg text-gray-600">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>

          <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver atrás
          </Button>

          {/* Script para detectar si es una URL de guía y mostrar el botón de reparación */}
          <div id="repair-button-container" className="hidden">
            <p className="text-sm text-gray-500 mt-4 mb-2">
              ¿Problemas con una guía? Intenta usar nuestra herramienta de reparación:
            </p>
            <Button variant="secondary" className="w-full" id="repair-button">
              <Tool className="mr-2 h-4 w-4" />
              Reparar esta guía
            </Button>
          </div>

          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function() {
                const path = window.location.pathname;
                const match = path.match(/\\/guias\\/(?:editar|ver)\\/(\\d+)/);
                
                if (match) {
                  const guiaId = match[1];
                  const container = document.getElementById('repair-button-container');
                  const button = document.getElementById('repair-button');
                  
                  if (container && button) {
                    container.classList.remove('hidden');
                    button.addEventListener('click', function() {
                      window.location.href = '/herramientas/reparar-guia/' + guiaId;
                    });
                  }
                }
              })();
            `,
            }}
          />
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Si crees que esto es un error, por favor contacta al administrador del sistema.</p>
          <p className="mt-2">ID de referencia: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
        </div>
      </div>
    </div>
  )
}
