import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import ContactsTable from "./contacts-table"
import { getContacts } from "@/lib/data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ContactosPage() {
  const contacts = await getContacts()

  // Filtrar contactos por tipo
  const anteriores = contacts.filter((c) => c.type === 1 || c.type === 3)
  const nuevos = contacts.filter((c) => c.type === 2 || c.type === 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contactos</h1>
        <Button asChild>
          <Link href="/contactos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Contacto
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList>
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
