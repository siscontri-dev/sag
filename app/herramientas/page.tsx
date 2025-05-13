"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wrench, Database, FileSearch } from "lucide-react"
import Link from "next/link"

export default function HerramientasPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 rounded-full border-2 shadow-sm hover:bg-gray-100 transition-all"
        >
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Herramientas de Mantenimiento</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Reparar Guía
            </CardTitle>
            <CardDescription>Herramienta para diagnosticar y reparar problemas con guías específicas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Utiliza esta herramienta cuando una guía no se puede editar o visualizar correctamente. La herramienta
              intentará identificar y corregir problemas comunes.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="ID de la guía"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  id="guia-id-input"
                />
                <Button
                  className="whitespace-nowrap"
                  onClick={() => {
                    const input = document.getElementById("guia-id-input") as HTMLInputElement
                    const id = input.value
                    if (id) {
                      window.location.href = `/herramientas/reparar-guia/${id}`
                    }
                  }}
                >
                  Reparar
                </Button>
              </div>
              <Button variant="outline" asChild>
                <Link href="/herramientas/reparar-guia/154">Reparar Guía #154</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              Verificar Base de Datos
            </CardTitle>
            <CardDescription>Herramienta para verificar la integridad de la base de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Ejecuta verificaciones en la base de datos para identificar problemas como referencias inválidas,
              registros huérfanos o datos inconsistentes.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/api/health">Verificar Estado</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-purple-500" />
              Buscar Guías Problemáticas
            </CardTitle>
            <CardDescription>Herramienta para identificar guías que podrían tener problemas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Analiza todas las guías en el sistema para identificar aquellas que podrían tener problemas como
              referencias inválidas o datos faltantes.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>
              Próximamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
