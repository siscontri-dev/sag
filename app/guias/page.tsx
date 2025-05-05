import { Button } from "@/components/ui/button"
import { PlusCircle, FileDown } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import { getTransactions } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { themeColors } from "@/lib/theme-config"

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
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
          Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <FileDown className="h-4 w-4" />
          </Button>
          <Button asChild style={{ backgroundColor: colors.dark, color: colors.text }}>
            <Link href={`/guias/nueva${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía
            </Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
        <CardHeader style={{ backgroundColor: colors.light }}>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Estadísticas de guías ICA</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 p-6">
          <div className="flex flex-col items-center p-4 rounded-lg" style={{ backgroundColor: colors.light }}>
            <span className="text-2xl font-bold" style={{ color: colors.text }}>
              {guias.length}
            </span>
            <span className="text-sm text-muted-foreground">Total Guías</span>
          </div>
          <div
            className="flex flex-col items-center p-4 rounded-lg"
            style={{ backgroundColor: themeColors.estado.borrador.bg }}
          >
            <span className="text-2xl font-bold" style={{ color: themeColors.estado.borrador.text }}>
              {borradores.length}
            </span>
            <span className="text-sm" style={{ color: themeColors.estado.borrador.text }}>
              Borradores
            </span>
          </div>
          <div
            className="flex flex-col items-center p-4 rounded-lg"
            style={{ backgroundColor: themeColors.estado.confirmado.bg }}
          >
            <span className="text-2xl font-bold" style={{ color: themeColors.estado.confirmado.text }}>
              {confirmadas.length}
            </span>
            <span className="text-sm" style={{ color: themeColors.estado.confirmado.text }}>
              Confirmadas
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="mb-4">
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
