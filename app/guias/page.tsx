import { Button } from "@/components/ui/button"
import { PlusCircle, Home } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import ExportButtons from "./export-buttons"
import { getTransactions } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { themeColors } from "@/lib/theme-config"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Modificar la función para determinar el tipo de animal basado en business_location_id
export default async function GuiasPage({
  searchParams,
}: {
  searchParams: { tipo?: string; fecha_inicio?: string; fecha_fin?: string; valor_min?: string; valor_max?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const fecha_inicio = searchParams.fecha_inicio || undefined
  const fecha_fin = searchParams.fecha_fin || undefined
  const valor_min = searchParams.valor_min ? Number(searchParams.valor_min) : undefined
  const valor_max = searchParams.valor_max ? Number(searchParams.valor_max) : undefined

  // Obtener las guías con el formato de fecha correcto desde la base de datos
  const guias = await getTransactions("entry", tipo)

  // Depurar las fechas para ver qué está llegando de la base de datos
  console.log(
    "Fechas originales de guías en page.tsx:",
    guias.slice(0, 5).map((g) => ({
      id: g.id,
      fecha_documento: g.fecha_documento,
      numero_documento: g.numero_documento,
    })),
  )

  // Filtrar por fecha si se proporcionan los parámetros
  let guiasFiltradas = guias
  if (fecha_inicio || fecha_fin) {
    const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date(0)
    const fechaFin = fecha_fin ? new Date(fecha_fin) : new Date()

    // Convertir las fechas de string a objetos Date para comparación
    guiasFiltradas = guias.filter((g) => {
      // Convertir la fecha formateada (DD/MM/YYYY) a un objeto Date
      const [day, month, year] = g.fecha_documento.split("/").map(Number)
      const fechaGuia = new Date(year, month - 1, day) // month - 1 porque en JS los meses van de 0 a 11

      return fechaGuia >= fechaInicio && fechaGuia <= fechaFin
    })
  }

  // Filtrar por valor de ticket si se proporcionan los parámetros
  if (valor_min !== undefined || valor_max !== undefined) {
    guiasFiltradas = guiasFiltradas.filter((g) => {
      const valorTotal = g.total || 0
      return (
        (valor_min === undefined || valorTotal >= valor_min) && (valor_max === undefined || valorTotal <= valor_max)
      )
    })
  }

  // Determinar el tipo de animal para cada guía basado en business_location_id
  guiasFiltradas.forEach((guia) => {
    guia.tipo_animal = guia.business_location_id === 1 ? "bovino" : "porcino"
  })

  // Filtrar por estado
  const borradores = guiasFiltradas.filter((g) => g.estado === "borrador")
  const confirmadas = guiasFiltradas.filter((g) => g.estado === "confirmado")
  const anuladas = guiasFiltradas.filter((g) => g.estado === "anulado")

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild style={{ backgroundColor: colors.dark, color: colors.text }}>
            <Link href={`/guias/nueva${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros de fecha y valor */}
      <Card className="shadow-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fecha_inicio" className="text-sm">
                Fecha Inicio
              </Label>
              <Input id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={fecha_inicio} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fecha_fin" className="text-sm">
                Fecha Fin
              </Label>
              <Input id="fecha_fin" name="fecha_fin" type="date" defaultValue={fecha_fin} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valor_min" className="text-sm">
                Valor Mínimo
              </Label>
              <Input
                id="valor_min"
                name="valor_min"
                type="number"
                defaultValue={valor_min}
                className="h-8"
                placeholder="Valor mínimo"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valor_max" className="text-sm">
                Valor Máximo
              </Label>
              <Input
                id="valor_max"
                name="valor_max"
                type="number"
                defaultValue={valor_max}
                className="h-8"
                placeholder="Valor máximo"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Aplicar Filtros</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
        <CardHeader style={{ backgroundColor: colors.light }}>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Estadísticas de guías ICA</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 p-6">
          <div className="flex flex-col items-center p-4 rounded-lg" style={{ backgroundColor: colors.light }}>
            <span className="text-2xl font-bold" style={{ color: colors.text }}>
              {guiasFiltradas.length}
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
          <ExportButtons tipo={tipo} />
          <GuiasTable guias={guiasFiltradas} />
        </TabsContent>
        <TabsContent value="borradores">
          <ExportButtons tipo={tipo} estado="borrador" />
          <GuiasTable guias={borradores} />
        </TabsContent>
        <TabsContent value="confirmadas">
          <ExportButtons tipo={tipo} estado="confirmado" />
          <GuiasTable guias={confirmadas} />
        </TabsContent>
        <TabsContent value="anuladas">
          <ExportButtons tipo={tipo} estado="anulado" />
          <GuiasTable guias={anuladas} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
