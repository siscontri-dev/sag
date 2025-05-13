import { Button } from "@/components/ui/button"
import { PlusCircle, Home } from "lucide-react"
import Link from "next/link"
import SacrificiosTable from "./sacrificios-table"
import { getTransactions } from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { themeColors } from "@/lib/theme-config"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ExportButtons from "./export-buttons"

export default async function SacrificiosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; fecha_inicio?: string; fecha_fin?: string; valor_min?: string; valor_max?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const fecha_inicio = searchParams.fecha_inicio || undefined
  const fecha_fin = searchParams.fecha_fin || undefined
  const valor_min = searchParams.valor_min ? Number(searchParams.valor_min) : undefined
  const valor_max = searchParams.valor_max ? Number(searchParams.valor_max) : undefined

  const sacrificios = await getTransactions("exit", tipo)

  // Filtrar por fecha si se proporcionan los parámetros
  let sacrificiosFiltrados = sacrificios
  if (fecha_inicio || fecha_fin) {
    const fechaInicio = fecha_inicio ? new Date(fecha_inicio) : new Date(0)
    const fechaFin = fecha_fin ? new Date(fecha_fin) : new Date()
    sacrificiosFiltrados = sacrificios.filter((s) => {
      const fechaSacrificio = new Date(s.fecha_documento)
      return fechaSacrificio >= fechaInicio && fechaSacrificio <= fechaFin
    })
  }

  // Filtrar por valor si se proporcionan los parámetros
  if (valor_min !== undefined || valor_max !== undefined) {
    sacrificiosFiltrados = sacrificiosFiltrados.filter((s) => {
      const valorTotal = s.total || 0
      return (
        (valor_min === undefined || valorTotal >= valor_min) && (valor_max === undefined || valorTotal <= valor_max)
      )
    })
  }

  // Filtrar por estado
  const borradores = sacrificiosFiltrados.filter((s) => s.estado === "borrador")
  const confirmados = sacrificiosFiltrados.filter((s) => s.estado === "confirmado")
  const anulados = sacrificiosFiltrados.filter((s) => s.estado === "anulado")

  // Calcular totales
  const totalKilos = sacrificiosFiltrados.reduce((sum, s) => sum + (s.quantity_k || 0), 0)
  const totalValor = sacrificiosFiltrados.reduce((sum, s) => sum + (s.total || 0), 0)

  // Determinar colores basados en el tipo
  const colors =
    tipo === "bovino"
      ? themeColors.bovino
      : tipo === "porcino"
        ? themeColors.porcino
        : { light: "#F9FAFB", medium: "#F3F4F6", dark: "#E5E7EB", text: "#111827" }

  const tipoAnimal = tipo

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
            Guías de Degüello {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild style={{ backgroundColor: colors.dark, color: colors.text }}>
            <Link href={`/sacrificios/nuevo${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía de Degüello
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm overflow-hidden">
          <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
          <CardHeader style={{ backgroundColor: colors.light }}>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Estadísticas de sacrificios</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 p-6">
            <div className="flex flex-col items-center p-4 rounded-lg" style={{ backgroundColor: colors.light }}>
              <span className="text-2xl font-bold" style={{ color: colors.text }}>
                {sacrificiosFiltrados.length}
              </span>
              <span className="text-sm text-muted-foreground">Total</span>
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
                {confirmados.length}
              </span>
              <span className="text-sm" style={{ color: themeColors.estado.confirmado.text }}>
                Confirmados
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden">
          <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
          <CardHeader style={{ backgroundColor: colors.light }}>
            <CardTitle>Totales</CardTitle>
            <CardDescription>Valores acumulados</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 p-6">
            <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50">
              <span className="text-2xl font-bold text-blue-800">
                {Math.round(totalKilos).toLocaleString("es-CO")} kg
              </span>
              <span className="text-sm text-blue-800">Peso Total</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-green-50">
              <span className="text-2xl font-bold text-green-800">
                {Math.round(totalValor).toLocaleString("es-CO")}
              </span>
              <span className="text-sm text-green-800">Valor Total</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="borradores">Borradores</TabsTrigger>
          <TabsTrigger value="confirmados">Confirmados</TabsTrigger>
          <TabsTrigger value="anulados">Anulados</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <SacrificiosTable sacrificios={sacrificiosFiltrados} tipoAnimal={tipoAnimal} />
        </TabsContent>
        <TabsContent value="borradores">
          <SacrificiosTable sacrificios={borradores} tipoAnimal={tipoAnimal} />
        </TabsContent>
        <TabsContent value="confirmados">
          <SacrificiosTable sacrificios={confirmados} tipoAnimal={tipoAnimal} />
        </TabsContent>
        <TabsContent value="anulados">
          <SacrificiosTable sacrificios={anulados} tipoAnimal={tipoAnimal} />
        </TabsContent>
      </Tabs>

      {/* Botones de exportación al final de la página */}
      <div className="flex justify-end mt-6">
        <ExportButtons tipo={tipo} />
      </div>
    </div>
  )
}
