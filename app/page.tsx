import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Users, FileText, Truck, PiggyBank, MilkIcon as Cow } from "lucide-react"
import { getTransactionStats } from "@/lib/data"

export default async function Home() {
  const stats = await getTransactionStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contactos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactCount}</div>
            <p className="text-xs text-muted-foreground">Clientes y proveedores registrados</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/contactos">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Guías ICA</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guiasCount}</div>
            <p className="text-xs text-muted-foreground">Documentos de ingreso</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/guias">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sacrificios</CardTitle>
            <Truck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sacrificiosCount}</div>
            <p className="text-xs text-muted-foreground">Registros de sacrificio</p>
            <Button asChild className="w-full mt-4" size="sm">
              <Link href="/sacrificios">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Kg</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalKilos.toLocaleString("es-CO")}</div>
            <p className="text-xs text-muted-foreground">Kilos procesados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Bovinos</CardTitle>
            <CardDescription>Administración de ganado vacuno</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <Cow className="w-12 h-12 text-primary" />
            <div className="space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/guias?tipo=bovino">Ingresos</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/sacrificios?tipo=bovino">Sacrificios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Porcinos</CardTitle>
            <CardDescription>Administración de ganado porcino</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <PiggyBank className="w-12 h-12 text-primary" />
            <div className="space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/guias?tipo=porcino">Ingresos</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/sacrificios?tipo=porcino">Sacrificios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
            {stats.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
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
