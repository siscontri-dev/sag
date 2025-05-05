import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import ContactsTable from "./contacts-table"
import { getContacts } from "@/lib/data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ContactosPage() {
  const contacts = await getContacts()

  // Filtrar contactos por tipo
  const anteriores = contacts.filter((c) => c.type === 1 || c.type === 3)
  const nuevos = contacts.filter((c) => c.type === 2 || c.type === 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Contactos</h1>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/contactos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardTitle className="text-purple-800">Resumen de Contactos</CardTitle>
          <CardDescription>Información general de contactos registrados</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl font-bold text-purple-800">{contacts.length}</span>
              <span className="text-sm text-purple-800">Total Contactos</span>
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
