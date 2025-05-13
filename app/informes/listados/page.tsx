import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ListFilter, Ticket, FileBarChart2 } from "lucide-react"
import Link from "next/link"
import { themeColors } from "@/lib/theme-config"

export default function ListadosPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    categoria?: string
  }
}) {
  const tipo = searchParams.tipo || "general"
  const categoria = searchParams.categoria || "general"

  // Determinar colores basados en el tipo
  const colors =
    tipo === "bovino"
      ? themeColors.bovino
      : tipo === "porcino"
        ? themeColors.porcino
        : { light: "#F9FAFB", medium: "#F3F4F6", dark: "#E5E7EB", text: "#111827" }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full border-2 shadow-sm hover:bg-gray-100 transition-all"
          >
            <Link href="/informes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Listados e Informes {tipo !== "general" && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
      </div>

      <Tabs defaultValue="guias" className="w-full">
        <TabsList className="mb-4 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="guias"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Guías ICA
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Tickets
          </TabsTrigger>
          <TabsTrigger
            value="sacrificios"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Sacrificios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guias" className="mt-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Guías ICA</CardTitle>
                <CardDescription>Listado completo de guías ICA con filtros avanzados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/informes/listados/guias${tipo !== "general" ? `?tipo=${tipo}` : ""}`}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    Ver Listado
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guías por Propietario</CardTitle>
                <CardDescription>Listado de guías agrupadas por propietario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <FileBarChart2 className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/informes/listados/guias-por-propietario${tipo !== "general" ? `?tipo=${tipo}` : ""}`}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    Ver Listado
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Tickets</CardTitle>
                <CardDescription>Listado completo de tickets con filtros avanzados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <Ticket className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/informes/listados/tickets${tipo !== "general" ? `?tipo=${tipo}` : ""}`}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    Ver Listado
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets Agrupados</CardTitle>
                <CardDescription>Listado de tickets agrupados por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <FileBarChart2 className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/informes/listados/tickets-agrupados${tipo !== "general" ? `?tipo=${tipo}` : ""}`}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    Ver Listado
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sacrificios" className="mt-2">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Listado de Sacrificios</CardTitle>
                <CardDescription>Listado completo de sacrificios con filtros avanzados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/informes/listados/sacrificios${tipo !== "general" ? `?tipo=${tipo}` : ""}`}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    Ver Listado
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
