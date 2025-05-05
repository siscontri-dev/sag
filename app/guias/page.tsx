import { Button } from "@/components/ui/button"
import { PlusCircle, FileDown } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import { getTransactions } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function GuiasPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const guias = await getTransactions("entry", tipo)

  // Filtrar por estado
  const borradores = guias.filter((g) => g.estado === "borrador")
  const confirmadas = guias.filter((g) => g.estado === "confirmado")
  const anuladas = guias.filter((g) => g.estado === "anulado")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <FileDown className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/guias/nueva${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Estadísticas de guías ICA</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-2xl font-bold">{guias.length}</span>
            <span className="text-sm text-muted-foreground">Total Guías</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-yellow-100 rounded-lg">
            <span className="text-2xl font-bold">{borradores.length}</span>
            <span className="text-sm text-yellow-800">Borradores</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-green-100 rounded-lg">
            <span className="text-2xl font-bold">{confirmadas.length}</span>
            <span className="text-sm text-green-800">Confirmadas</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="borradores">Borradores</TabsTrigger>
          <TabsTrigger value="confirmadas">Confirmadas</TabsTrigger>
          <TabsTrigger value="anuladas">Anuladas</TabsTrigger>
        </TabsList>
        <TabsContent value="todas">
          <GuiasTable guias={guias} />
        </TabsContent>
        <TabsContent value="borradores">
          <GuiasTable guias={borradores} />
        </TabsContent>
        <TabsContent value="confirmadas">
          <GuiasTable guias={confirmadas} />
        </TabsContent>
        <TabsContent value="anuladas">
          <GuiasTable guias={anuladas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
