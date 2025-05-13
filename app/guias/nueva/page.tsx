"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GuiaForm from "../guia-form"
import { getContacts, getProducts } from "@/lib/data"
import { getRazasByTipoAndLocation, getColoresByTipoAndLocation } from "@/lib/catalogs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

// Modificar la importación para incluir noStore
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NuevaGuiaPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  // Añadir noStore para evitar caché
  noStore()

  const tipo = searchParams.tipo || "bovino" // Default a bovino si no se especifica

  // Determinar la ubicación basada en el tipo de animal
  const locationId = tipo === "bovino" ? 1 : 2

  console.log(`Iniciando carga de datos para nueva guía: tipo=${tipo}, locationId=${locationId}`)

  try {
    // Obtener datos necesarios usando las funciones existentes
    // Cargar cada conjunto de datos por separado para identificar posibles errores
    console.log("Cargando contactos...")
    const contacts = await getContacts()
    console.log(`Contactos cargados: ${contacts.length}`)

    console.log(`Cargando productos para tipo=${tipo}, locationId=${locationId}...`)
    const products = await getProducts(tipo, locationId)
    console.log(`Productos cargados: ${products.length}`)

    console.log(`Cargando razas para tipo=${tipo}, locationId=${locationId}...`)
    const razas = await getRazasByTipoAndLocation(tipo, locationId)
    console.log(`Razas cargadas: ${razas.length}`)

    console.log(`Cargando colores para tipo=${tipo}, locationId=${locationId}...`)
    const colores = await getColoresByTipoAndLocation(tipo, locationId)
    console.log(`Colores cargados: ${colores.length}`)

    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/guias">Guías ICA</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Nueva Guía</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold tracking-tight">
          Nueva Guía ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Guía</CardTitle>
            <CardDescription>Ingrese los datos de la nueva guía de ingreso</CardDescription>
          </CardHeader>
          <CardContent>
            <GuiaForm
              contacts={contacts || []}
              products={products || []}
              tipoAnimal={tipo}
              locationId={locationId}
              razas={razas || []}
              colores={colores || []}
            />
          </CardContent>
        </Card>
      </div>
    )
  } catch (error) {
    console.error("Error al cargar la página de nueva guía:", error)
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/guias">Guías ICA</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Nueva Guía</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold tracking-tight">
          Nueva Guía ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Error al cargar datos</CardTitle>
            <CardDescription>Hubo un problema al cargar los datos necesarios para el formulario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
              <p className="font-medium">Error: {error.message}</p>
              <p className="mt-2">Por favor, intente recargar la página o contacte al administrador del sistema.</p>
              <div className="mt-4">
                <Button onClick={() => window.location.reload()}>Recargar página</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
