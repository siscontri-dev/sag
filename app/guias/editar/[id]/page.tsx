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

// Modifica la función para incluir manejo de errores y logs de depuración

export default async function EditarGuiaPage({ params }: { params: { id: string } }) {
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
      </div>
    )
  }

  if (!guia) {
    console.log(`Guía con ID ${id} no encontrada`)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Guía no encontrada</h1>
        <p>La guía con ID {id} no existe o ha sido eliminada.</p>
      </div>
    )
  }

  if (guia.type !== "entry") {
    console.log(`Guía con ID ${id} no es de tipo "entry", es de tipo "${guia.type}"`)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-red-600">Tipo de guía incorrecto</h1>
        <p>La guía con ID {id} no es una guía de entrada.</p>
      </div>
    )
  }

  // Actualizar la determinación del tipo de animal
  const tipoAnimal = guia.business_location_id === 1 ? "bovino" : "porcino"
  const locationId = guia.business_location_id

  // Obtener datos necesarios
  let contacts, products, razas, colores
  try {
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
