import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContactById, getDepartamentos, getUbicacionesByContacto } from "@/lib/data"
import { notFound } from "next/navigation"
import UbicacionForm from "./ubicacion-form"
import UbicacionesTable from "./ubicaciones-table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function UbicacionesContactoPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const [contactData, departamentos, ubicaciones] = await Promise.all([
    getContactById(id),
    getDepartamentos(),
    getUbicacionesByContacto(id),
  ])

  if (!contactData || !contactData.contact) {
    notFound()
  }

  const { contact } = contactData
  const nombreCompleto = `${contact.primer_nombre} ${contact.primer_apellido}`

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
            <BreadcrumbLink href="/contactos">Contactos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/contactos/ver/${id}`}>{nombreCompleto}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Ubicaciones</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ubicaciones de {nombreCompleto}</h1>
        <Button asChild>
          <Link href={`/contactos/ver/${id}`}>Ver Contacto</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Añadir Nueva Ubicación</CardTitle>
          <CardDescription>Ingrese los datos de la finca o ubicación</CardDescription>
        </CardHeader>
        <CardContent>
          <UbicacionForm contactId={id} departamentos={departamentos} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones Registradas</CardTitle>
          <CardDescription>Fincas y ubicaciones asociadas a este contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <UbicacionesTable ubicaciones={ubicaciones} contactId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
