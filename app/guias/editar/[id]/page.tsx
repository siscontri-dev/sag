import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GuiaForm from "../../guia-form"
import { getContacts, getProducts, getTransactionById } from "@/lib/data"
import { getRazasByTipoAndLocation, getColoresByTipoAndLocation } from "@/lib/catalogs"
import { notFound } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export default async function EditarGuiaPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const guia = await getTransactionById(id)

  if (!guia || guia.type !== "entry") {
    notFound()
  }

  // Actualizar la determinación del tipo de animal
  const tipoAnimal = guia.business_location_id === 1 ? "bovino" : "porcino"
  const locationId = guia.business_location_id

  // Obtener datos necesarios
  const [contacts, products, razas, colores] = await Promise.all([
    getContacts(),
    getProducts(tipoAnimal, locationId),
    getRazasByTipoAndLocation(tipoAnimal, locationId),
    getColoresByTipoAndLocation(tipoAnimal, locationId),
  ])

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
