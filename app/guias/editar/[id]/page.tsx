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
import { Home, AlertTriangle } from "lucide-react"
import { Suspense, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
export default function EditarGuiaPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EditarGuiaContent params={params} />
    </Suspense>
  )
}

// Componente de contenido que maneja la lógica principal
function EditarGuiaContent({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const [guia, setGuia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [razas, setRazas] = useState<any[]>([])
  const [colores, setColores] = useState<any[]>([])
  const [tipoAnimal, setTipoAnimal] = useState<string>("")
  const [locationId, setLocationId] = useState<number>(0)

  // Cargar los datos de la guía
  useEffect(() => {
    async function loadData() {
      try {
        console.log(`Intentando editar guía con ID: ${id}`)
        setLoading(true)
        setError(null)

        // Cargar la guía
        const guiaData = await getTransactionById(id)

        if (!guiaData) {
          console.log(`Guía con ID ${id} no encontrada`)
          setError(new Error(`La guía con ID ${id} no existe o ha sido eliminada.`))
          setLoading(false)
          return
        }

        console.log(`Guía obtenida:`, guiaData ? `ID: ${guiaData.id}, Tipo: ${guiaData.type}` : "No encontrada")

        // Verificar el tipo de guía
        if (guiaData.type !== "entry" && guiaData.type !== "ica") {
          console.log(`Guía con ID ${id} no es de tipo "entry" ni "ica", es de tipo "${guiaData.type}"`)
          setError(new Error(`La guía con ID ${id} no es una guía de entrada ni una guía ICA.`))
          setLoading(false)
          return
        }

        setGuia(guiaData)

        // Determinar el tipo de animal y la ubicación
        const tipo = guiaData.business_location_id === 1 ? "bovino" : "porcino"
        setTipoAnimal(tipo)
        setLocationId(guiaData.business_location_id)

        // Cargar datos adicionales
        try {
          const [contactsData, productsData, razasData, coloresData] = await Promise.all([
            getContacts(),
            getProducts(tipo, guiaData.business_location_id),
            getRazasByTipoAndLocation(tipo, guiaData.business_location_id),
            getColoresByTipoAndLocation(tipo, guiaData.business_location_id),
          ])

          setContacts(contactsData)
          setProducts(productsData)
          setRazas(razasData)
          setColores(coloresData)
        } catch (dataError) {
          console.error(`Error al obtener datos adicionales:`, dataError)
          setError(new Error(`Error al cargar datos adicionales: ${dataError.message}`))
        }
      } catch (err) {
        console.error(`Error al cargar la guía:`, err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  // Mostrar estado de carga
  if (loading) {
    return <LoadingState />
  }

  // Mostrar error
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Error al cargar la guía</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Se produjo un error al intentar cargar la guía. Por favor, inténtelo de nuevo más tarde.
          </AlertDescription>
        </Alert>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Detalles del error:</h3>
          <p className="text-red-700 mt-2">{error.message}</p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button asChild variant="default">
            <a href="/guias">Volver a Guías</a>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // Si no hay guía (aunque debería estar cubierto por el error)
  if (!guia) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Guía no encontrada</h1>
        <p>La guía con ID {id} no existe o ha sido eliminada.</p>
        <Button asChild>
          <a href="/guias">Volver a Guías</a>
        </Button>
      </div>
    )
  }

  // Determinar el título y descripción según el tipo de guía
  const esGuiaICA = guia.type === "ica"
  const titulo = esGuiaICA ? `Editar Guía ICA #${guia.numero_documento}` : `Editar Guía #${guia.numero_documento}`

  const descripcion = esGuiaICA ? "Actualice los datos de la guía ICA" : "Actualice los datos de la guía"

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
            <BreadcrumbLink>{titulo}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">
        {titulo} {tipoAnimal && `(${tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"})`}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Guía</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
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
