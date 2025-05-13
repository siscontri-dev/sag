import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, FileText, Truck, PiggyBank, Ticket, DollarSign, BarChart } from "lucide-react"
import { getTransactionStats, getFinancialData } from "@/lib/data"
import { FinancialDashboard } from "@/components/dashboard/financial-dashboard"

// Modificar la función Home para manejar mejor los errores:

export default async function Home() {
  let stats
  let financialData

  try {
    stats = await getTransactionStats()
  } catch (error) {
    console.error("Error al cargar estadísticas:", error)
    stats = {
      contactCount: 0,
      guiasCount: 0,
      sacrificiosCount: 0,
      guiasBovinos: 0,
      guiasPorcinos: 0,
      sacrificiosBovinos: 0,
      sacrificiosPorcinos: 0,
      totalKilos: 0,
      recentTransactions: [],
    }
  }

  try {
    financialData = await getFinancialData()
  } catch (error) {
    console.error("Error al cargar datos financieros:", error)
    financialData = {
      transactions: [],
      monthlyStats: [],
      animalTypeStats: [],
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
      </div>

      {/* Gestión de Bovinos y Porcinos (ahora arriba) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-blue-800">Gestión de Bovinos</CardTitle>
            <CardDescription>Administración de ganado vacuno</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Gestión de Bovinos</h3>
                <p className="text-sm text-muted-foreground">Administra guías y sacrificios de bovinos</p>
              </div>
              <img src="/images/vaca.png" alt="Bovino" className="h-16 w-16" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm">
                  <Link href="/guias?tipo=bovino">Guías ICA</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm">
                  <Link href="/sacrificios?tipo=bovino">Guías de Degüello</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm">
                  <Link href="/contactos?business_location_id=1">Contactos</Link>
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
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm">
                  <Link href="/guias?tipo=porcino">Guías ICA</Link>
                </Button>
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm">
                  <Link href="/sacrificios?tipo=porcino">Guías de Degüello</Link>
                </Button>
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm">
                  <Link href="/contactos?business_location_id=2">Contactos</Link>
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

      {/* Primera fila de 3 cuadros */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contactos</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactCount}</div>
            <p className="text-xs text-muted-foreground">Clientes y proveedores registrados</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button asChild className="bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm" size="sm">
                <Link href="/contactos?business_location_id=1">Bovinos</Link>
              </Button>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm" size="sm">
                <Link href="/contactos?business_location_id=2">Porcinos</Link>
              </Button>
            </div>
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
            <Button asChild className="w-full mt-3 bg-green-500 hover:bg-green-600 rounded-lg shadow-sm" size="sm">
              <Link href="/guias">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Guías de Degüello</CardTitle>
            <Truck className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sacrificiosCount}</div>
            <p className="text-xs text-muted-foreground">Registros de sacrificio</p>
            <Button asChild className="w-full mt-3 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm" size="sm">
              <Link href="/sacrificios">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila de 3 cuadros */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Ticket className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión</div>
            <p className="text-xs text-muted-foreground">Administración de tickets</p>
            <Button asChild className="w-full mt-3 bg-purple-500 hover:bg-purple-600 rounded-lg shadow-sm" size="sm">
              <Link href="/tickets">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Impuestos</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión</div>
            <p className="text-xs text-muted-foreground">Administración de impuestos</p>
            <Button asChild className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm" size="sm">
              <Link href="/impuestos">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Informes</CardTitle>
            <BarChart className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Reportes</div>
            <p className="text-xs text-muted-foreground">Estadísticas y análisis</p>
            <Button asChild className="w-full mt-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-sm" size="sm">
              <Link href="/informes">Gestionar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Financiero (reemplaza la sección de Actividad Reciente) */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Dashboard Financiero</CardTitle>
          <CardDescription>Análisis de ingresos, gastos e impuestos</CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialDashboard initialData={financialData} />
        </CardContent>
      </Card>
    </div>
  )
}
