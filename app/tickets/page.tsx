import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TicketManager from "@/components/ticket-manager"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

export default async function TicketsPage() {
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
            <BreadcrumbLink>Gestión de Tickets</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold tracking-tight">Gestión de Tickets</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <TicketManager locationId={1} locationName="Bovinos" />
        <TicketManager locationId={2} locationName="Porcinos" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información sobre Tickets</CardTitle>
          <CardDescription>Cómo funciona el sistema de tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              El sistema de tickets está diseñado para generar números de ticket únicos por mes y por ubicación. Cada
              mes, los contadores se reinician automáticamente.
            </p>
            <h3 className="text-lg font-medium">Características principales:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Generación automática:</strong> Cada vez que se presiona el botón "Generar Ticket", se obtiene
                el siguiente número disponible.
              </li>
              <li>
                <strong>Reinicio mensual:</strong> Los contadores se reinician automáticamente al inicio de cada mes.
              </li>
              <li>
                <strong>Reinicio manual:</strong> Si es necesario, puede reiniciar manualmente el contador en cualquier
                momento.
              </li>
              <li>
                <strong>Separación por ubicación:</strong> Cada ubicación (Bovinos y Porcinos) tiene su propio contador
                independiente.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
