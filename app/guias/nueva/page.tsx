import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GuiaForm from "../guia-form"
import { getContacts, getLocations, getProducts } from "@/lib/data"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export default async function NuevaGuiaPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const [locations, contacts, products] = await Promise.all([getLocations(), getContacts(), getProducts(tipo)])

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
          <GuiaForm locations={locations} contacts={contacts} products={products} tipoAnimal={tipo} />
        </CardContent>
      </Card>
    </div>
  )
}
