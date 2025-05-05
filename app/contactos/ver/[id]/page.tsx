import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContactById, getUbicacionesByContacto } from "@/lib/data"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, MapPin, Plus } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function VerContactoPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const [contactData, ubicaciones] = await Promise.all([getContactById(id), getUbicacionesByContacto(id)])

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
            <BreadcrumbLink>Ver Contacto</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{nombreCompleto}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/contactos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/contactos/editar/${contact.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/contactos/ubicaciones/${contact.id}`}>
              <MapPin className="mr-2 h-4 w-4" />
              Gestionar Ubicaciones
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Datos básicos del contacto</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Nombre Completo</dt>
                <dd>{nombreCompleto}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">NIT/Cédula</dt>
                <dd>{contact.nit}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
                <dd>{contact.telefono || "No registrado"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                <dd>{contact.email || "No registrado"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Tipo</dt>
                <dd>{contact.type === 1 ? "Dueño Anterior" : contact.type === 2 ? "Dueño Nuevo" : "Ambos"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
                <dd>
                  <Badge variant={contact.activo ? "default" : "destructive"}>
                    {contact.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ubicaciones</CardTitle>
              <CardDescription>Ubicaciones registradas</CardDescription>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/contactos/ubicaciones/${contact.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ubicaciones.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay ubicaciones registradas para este contacto.
              </p>
            ) : (
              <div className="space-y-4">
                {ubicaciones.map((ubicacion) => (
                  <div key={ubicacion.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">
                        {ubicacion.nombre_finca}
                        {ubicacion.es_principal && (
                          <Badge variant="outline" className="ml-2">
                            Principal
                          </Badge>
                        )}
                      </h3>
                      <Badge variant={ubicacion.activo ? "default" : "destructive"}>
                        {ubicacion.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ubicacion.direccion}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ubicacion.municipio_nombre}, {ubicacion.departamento_nombre}
                    </p>
                    {ubicacion.area_hectareas && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Área:</span> {ubicacion.area_hectareas} hectáreas
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
