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

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NuevaGuiaPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipo = searchParams.tipo || "bovino" // Default a bovino si no se especifica

  // Determinar la ubicación basada en el tipo de animal
  const locationId = tipo === "bovino" ? 1 : 2

  // Obtener datos necesarios usando las funciones existentes
  const [contacts, products, razas, colores] = await Promise.all([
    getContacts(),
    getProducts(tipo, locationId),
    getRazasByTipoAndLocation(tipo, locationId),
    getColoresByTipoAndLocation(tipo, locationId),
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
            contacts={contacts}
            products={products}
            tipoAnimal={tipo}
            locationId={locationId}
            razas={razas}
            colores={colores}
          />
        </CardContent>
      </Card>
    </div>
  )
}
