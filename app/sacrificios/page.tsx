import { Button } from "@/components/ui/button"
import { PlusCircle, FileDown } from "lucide-react"
import Link from "next/link"
import SacrificiosTable from "./sacrificios-table"
import { getTransactions } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SacrificiosPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const sacrificios = await getTransactions("exit", tipo)

  // Filtrar por estado
  const borradores = sacrificios.filter((s) => s.estado === "borrador")
  const confirmados = sacrificios.filter((s) => s.estado === "confirmado")
  const anulados = sacrificios.filter((s) => s.estado === "anulado")

  // Calcular totales
  const totalKilos = sacrificios.reduce((sum, s) => {
    const lines = s.transaction_lines || []
    return sum + lines.reduce((lineSum, line) => lineSum + (line.quantity || 0), 0)
  }, 0)

  const totalValor = sacrificios.reduce((sum, s) => sum + (s.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Sacrificios {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <FileDown className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/sacrificios/nuevo${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Sacrificio
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Estadísticas de sacrificios</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
              <span className="text-2xl font-bold">{sacrificios.length}</span>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-yellow-100 rounded-lg">
              <span className="text-2xl font-bold">{borradores.length}</span>
              <span className="text-sm text-yellow-800">Borradores</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-100 rounded-lg">
              <span className="text-2xl font-bold">{confirmados.length}</span>
              <span className="text-sm text-green-800">Confirmados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totales</CardTitle>
            <CardDescription>Valores acumulados</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-blue-100 rounded-lg">
              <span className="text-2xl font-bold">{totalKilos.toLocaleString("es-CO")} kg</span>
              <span className="text-sm text-blue-800">Peso Total</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-100 rounded-lg">
              <span className="text-2xl font-bold">${totalValor.toLocaleString("es-CO")}</span>
              <span className="text-sm text-green-800">Valor Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="borradores">Borradores</TabsTrigger>
          <TabsTrigger value="confirmados">Confirmados</TabsTrigger>
          <TabsTrigger value="anulados">Anulados</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <SacrificiosTable sacrificios={sacrificios} />
        </TabsContent>
        <TabsContent value="borradores">
          <SacrificiosTable sacrificios={borradores} />
        </TabsContent>
        <TabsContent value="confirmados">
          <SacrificiosTable sacrificios={confirmados} />
        </TabsContent>
        <TabsContent value="anulados">
          <SacrificiosTable sacrificios={anulados} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
