import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ContactForm from "../contact-form"
import { getLocations, getDepartamentos } from "@/lib/data"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export default async function NuevoContactoPage() {
  const [locations, departamentos] = await Promise.all([getLocations(), getDepartamentos()])

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
            <BreadcrumbLink>Nuevo Contacto</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">Nuevo Contacto</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información del Contacto</CardTitle>
          <CardDescription>Ingrese los datos del nuevo contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm locations={locations} departamentos={departamentos} />
        </CardContent>
      </Card>
    </div>
  )
}
