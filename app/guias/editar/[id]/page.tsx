"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GuiaForm from "../../guia-form"
import { getContacts, getProducts, getTransactionById } from "@/lib/data"
import { getRazasByTipoAndLocation, getColoresByTipoAndLocation } from "@/lib/catalogs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { Suspense } from "react"

// Componente de carga
function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 animate-pulse rounded w-1/2"></div>
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 animate-pulse rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal con manejo de errores
export default async function EditarGuiaPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditarGuiaContent params={params} />
    </Suspense>
  )
}

// Componente de contenido que maneja la lógica principal
async function EditarGuiaContent({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  console.log(`Intentando editar guía con ID: ${id}`)

  let guia
  try {
    guia = await getTransactionById(id)
    console.log(`Guía obtenida:`, guia ? `ID: ${guia.id}, Tipo: ${guia.type}` : "No encontrada")
  } catch (error) {
    console.error(`Error al obtener la guía con ID ${id}:`, error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Error al cargar la guía</h1>
        <p>Se produjo un error al intentar cargar la guía. Por favor, inténtelo de nuevo más tarde.</p>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Detalles del error:</h3>
          <p className="text-red-700 mt-2">{error instanceof Error ? error.message : String(error)}</p>
        </div>
        <div className="flex gap-4 mt-4">
          <a href="/guias" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Volver a Guías
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!guia) {
    console.log(`Guía con ID ${id} no encontrada`)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Guía no encontrada</h1>
        <p>La guía con ID {id} no existe o ha sido eliminada.</p>
        <a href="/guias" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block mt-4">
          Volver a Guías
        </a>
      </div>
    )
  }

  if (guia.type !== "entry") {
    console.log(`Guía con ID ${id} no es de tipo "entry", es de tipo "${guia.type}"`)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Tipo de guía incorrecto</h1>
        <p>La guía con ID {id} no es una guía de entrada.</p>
        <a href="/guias" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block mt-4">
          Volver a Guías
        </a>
      </div>
    )
  }

  // Actualizar la determinación del tipo de animal
  const tipoAnimal = guia.business_location_id === 1 ? "bovino" : "porcino"
  const locationId = guia.business_location_id

  // Obtener datos necesarios
  let contacts, products, razas, colores
  try {
    // Usar las funciones existentes para obtener los datos
    ;[contacts, products, razas, colores] = await Promise.all([
      getContacts(),
      getProducts(tipoAnimal, locationId),
      getRazasByTipoAndLocation(tipoAnimal, locationId),
      getColoresByTipoAndLocation(tipoAnimal, locationId),
    ])
  } catch (error) {
    console.error(`Error al obtener datos adicionales para la guía con ID ${id}:`, error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Error al cargar datos adicionales</h1>
        <p>
          Se produjo un error al intentar cargar los datos adicionales para la guía. Por favor, inténtelo de nuevo más
          tarde.
        </p>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Detalles del error:</h3>
          <p className="text-red-700 mt-2">{error instanceof Error ? error.message : String(error)}</p>
        </div>
        <div className="flex gap-4 mt-4">
          <a href="/guias" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Volver a Guías
          </a>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

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
            <BreadcrumbLink>Editar Guía #{guia.numero_documento}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">
        Editar Guía #{guia.numero_documento} {tipoAnimal && `(${tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"})`}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Guía</CardTitle>
          <CardDescription>Actualice los datos de la guía</CardDescription>
        </CardHeader>
        <CardContent>
          <GuiaForm
            contacts={contacts}
            products={products}
            tipoAnimal={tipoAnimal}
            locationId={locationId}
            razas={razas}
            colores={colores}
            guia={guia}
          />
        </CardContent>
      </Card>
    </div>
  )
}
