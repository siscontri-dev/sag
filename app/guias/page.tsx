import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import TicketsTable from "./tickets-table"
import TicketsAgrupadosPorDia from "./tickets-agrupados-por-dia"
import ExportButtons from "./export-buttons"
import { getTransactions, getTicketsLines } from "@/lib/data"
import { themeColors } from "@/lib/theme-config"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { processObjectDates } from "@/lib/date-interceptor"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GuiasPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    propietario?: string
    propietario_id?: string
    limit?: string
    tab?: string
    fechaDesde?: string
    fechaHasta?: string
    estado?: string
  }
}) {
  // Añadir al inicio de la función, después de obtener los parámetros
  console.log("Parámetros de búsqueda recibidos:", searchParams)

  const tipo = searchParams.tipo || undefined
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit) : 30
  const activeTab = searchParams.tab || "lista"
  const fechaDesde = searchParams.fechaDesde || undefined
  const fechaHasta = searchParams.fechaHasta || undefined
  const estado = searchParams.estado || undefined

  // Obtener guías con manejo de errores
  let guias = []
  let guiasError = null
  try {
    const rawGuias = await getTransactions("entry", tipo, limit)
    // Procesar fechas para asegurar que sean strings
    guias = processObjectDates(rawGuias)
    console.log(`Total de guías obtenidas: ${guias.length}`)
  } catch (error) {
    console.error("Error al obtener guías:", error)
    guiasError = error.message || "Error al obtener guías"
  }

  // Obtener tickets con manejo de errores - usar -1 para obtener todos los tickets
  let tickets = []
  let ticketsError = null
  try {
    // Limitar a 100 tickets para evitar problemas de rendimiento
    const rawTickets = await getTicketsLines(tipo, 100)
    // Procesar fechas para asegurar que sean strings
    tickets = processObjectDates(rawTickets)
    console.log(`Total de tickets obtenidos: ${tickets.length}`)
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    ticketsError = error.message || "Error al obtener tickets"
  }

  // Determinar el tipo de animal para cada guía basado en business_location_id
  guias.forEach((guia) => {
    guia.tipo_animal = guia.business_location_id === 1 ? "bovino" : "porcino"
  })

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
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="rounded-full px-6 py-2 font-semibold shadow-md hover:shadow-lg transition-all"
            style={{
              backgroundColor: tipo === "bovino" ? "#1E40AF" : tipo === "porcino" ? "#7E22CE" : "#2563EB",
              color: "white",
            }}
          >
            <Link href={`/guias/nueva${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Nueva Guía ICA
            </Link>
          </Button>
        </div>
      </div>

      {/* Sistema de pestañas */}
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-4 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="lista"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Lista
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Tickets
          </TabsTrigger>
          <TabsTrigger
            value="tickets-agrupados"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Tickets Agrupados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-2">
          <div className="space-y-4">
            {guiasError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{guiasError}</AlertDescription>
              </Alert>
            ) : (
              <>
                <ExportButtons tipo={tipo} />
                <GuiasTable guias={guias} currentLimit={limit} />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="mt-2">
          <div className="space-y-4">
            {ticketsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{ticketsError}</AlertDescription>
              </Alert>
            ) : (
              <TicketsTable tickets={tickets.slice(0, limit)} currentLimit={limit} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="tickets-agrupados" className="mt-2">
          <div className="space-y-4">
            {ticketsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{ticketsError}</AlertDescription>
              </Alert>
            ) : (
              <TicketsAgrupadosPorDia tickets={tickets} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
