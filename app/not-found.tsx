import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Página no encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" asChild>
          <Link href="/" className="flex items-center gap-2">
            <Home size={16} />
            Ir al inicio
          </Link>
        </Button>

        <Button variant="default" asChild>
          <Link href="javascript:history.back()" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Volver atrás
          </Link>
        </Button>
      </div>

      <div className="mt-12 text-sm text-gray-500">
        <p>Si crees que esto es un error, por favor contacta al administrador del sistema.</p>
        <p className="mt-2">ID de referencia: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
      </div>
    </div>
  )
}
