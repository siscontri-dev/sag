import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import ContactsTable from "./contacts-table"
import { getContacts } from "@/lib/data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ContactosPage({ searchParams }) {
  const businessLocationId = searchParams?.business_location_id
    ? Number.parseInt(searchParams.business_location_id)
    : null
  const contacts = await getContacts(businessLocationId)

  // Filtrar contactos por tipo
  const anteriores = contacts.filter((c) => c.type === 1 || c.type === 3)
  const nuevos = contacts.filter((c) => c.type === 2 || c.type === 3)

  // Determinar el título y color según el business_location_id
  let title = "Contactos"
  let color = "purple"
  let locationName = ""

  if (businessLocationId === 1) {
    title = "Contactos de Bovinos"
    color = "blue"
    locationName = "Bovinos"
  } else if (businessLocationId === 2) {
    title = "Contactos de Porcinos"
    color = "amber"
    locationName = "Porcinos"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">{title}</h1>
        <Button asChild className={`bg-${color}-600 hover:bg-${color}-700`}>
          <Link href={`/contactos/nuevo${businessLocationId ? `?business_location_id=${businessLocationId}` : ""}`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Contacto {locationName && `de ${locationName}`}
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className={`h-1 bg-gradient-to-r from-${color}-400 to-${color}-600`}></div>
        <CardHeader className={`bg-gradient-to-r from-${color}-50 to-${color}-100`}>
          <CardTitle className={`text-${color}-800`}>
            Resumen de Contactos {locationName && `de ${locationName}`}
          </CardTitle>
          <CardDescription>Información general de contactos registrados</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className={`flex flex-col items-center p-4 bg-${color}-50 rounded-lg`}>
              <span className={`text-2xl font-bold text-${color}-800`}>{contacts.length}</span>
              <span className={`text-sm text-${color}-800`}>Total Contactos</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-2xl font-bold text-blue-800">{anteriores.length}</span>
              <span className="text-sm text-blue-800">Dueños Anteriores</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-amber-50 rounded-lg">
              <span className="text-2xl font-bold text-amber-800">{nuevos.length}</span>
              <span className="text-sm text-amber-800">Dueños Nuevos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="anteriores">Dueños Anteriores</TabsTrigger>
          <TabsTrigger value="nuevos">Dueños Nuevos</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <ContactsTable contacts={contacts} />
        </TabsContent>
        <TabsContent value="anteriores">
          <ContactsTable contacts={anteriores} />
        </TabsContent>
        <TabsContent value="nuevos">
          <ContactsTable contacts={nuevos} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
