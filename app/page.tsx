import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, FileText, Truck, PiggyBank, MilkIcon as Cow, Ticket } from "lucide-react"
import { getTransactionStats } from "@/lib/data"

export default async function Home() {
  const stats = await getTransactionStats()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contactos</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactCount}</div>
            <p className="text-xs text-muted-foreground">Clientes y proveedores registrados</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/contactos">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Guías ICA</CardTitle>
            <FileText className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guiasCount}</div>
            <p className="text-xs text-muted-foreground">Documentos de ingreso</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/guias">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sacrificios</CardTitle>
            <Truck className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sacrificiosCount}</div>
            <p className="text-xs text-muted-foreground">Registros de sacrificio</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/sacrificios">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Ticket className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión</div>
            <p className="text-xs text-muted-foreground">Administración de tickets</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/tickets">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-blue-800">Gestión de Bovinos</CardTitle>
            <CardDescription>Administración de ganado vacuno</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center p-6">
            <Cow className="w-16 h-16 text-blue-500" />
            <div className="space-y-3">
              <div className="space-x-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Link href="/guias?tipo=bovino">Guías ICA</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Link href="/sacrificios?tipo=bovino">Sacrificios</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Link href="/reportes?tipo=bovino">Informes</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Link href="/tickets?tipo=bovino">Tickets</Link>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Guías: {stats.guiasBovinos || 0} | Sacrificios: {stats.sacrificiosBovinos || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
            <CardTitle className="text-amber-800">Gestión de Porcinos</CardTitle>
            <CardDescription>Administración de ganado porcino</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center p-6">
            <PiggyBank className="w-16 h-16 text-amber-500" />
            <div className="space-y-3">
              <div className="space-x-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Link href="/guias?tipo=porcino">Guías ICA</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Link href="/sacrificios?tipo=porcino">Sacrificios</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Link href="/reportes?tipo=porcino">Informes</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Link href="/tickets?tipo=porcino">Tickets</Link>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Guías: {stats.guiasPorcinos || 0} | Sacrificios: {stats.sacrificiosPorcinos || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas transacciones registradas</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-100 transition-colors`}
              >
                <div>
                  <p className="font-medium">{transaction.numero_documento}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.type === "entry" ? "Guía ICA" : "Sacrificio"} -
                    {new Date(transaction.fecha_documento).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${transaction.total.toLocaleString("es-CO")}</p>
                  <p className="text-sm text-muted-foreground">{transaction.dueno_anterior_nombre}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
