import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ContactForm from "../../contact-form"
import { getContactById, getLocations, getDepartamentos, getUbicacionesByContacto } from "@/lib/data"
import { notFound } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export default async function EditarContactoPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const [contactData, locations, departamentos, ubicaciones] = await Promise.all([
    getContactById(id),
    getLocations(),
    getDepartamentos(),
    getUbicacionesByContacto(id),
  ])

  if (!contactData || !contactData.contact) {
    notFound()
  }

  const { contact } = contactData

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
            <BreadcrumbLink>Editar Contacto</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">Editar Contacto</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información del Contacto</CardTitle>
          <CardDescription>Actualice los datos del contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            locations={locations}
            contact={contact}
            departamentos={departamentos}
            ubicaciones={ubicaciones}
          />
        </CardContent>
      </Card>
    </div>
  )
}
