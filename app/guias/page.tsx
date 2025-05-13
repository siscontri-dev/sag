import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import TicketsTable from "./tickets-table"
import TicketsAgrupadosPorDia from "./tickets-agrupados-por-dia"
import ExportButtons from "./export-buttons"
import { themeColors } from "@/lib/theme-config"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { sql } from "@vercel/postgres"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Función para obtener guías directamente usando sql de @vercel/postgres
async function getGuias(tipo = undefined, limit = 30) {
  try {
    // Convertir tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    // Construir la consulta usando tagged template literals
    let query
    if (locationId) {
      query = sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = 'entry' AND t.business_location_id = ${locationId}
        ORDER BY 
          t.id DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = 'entry'
        ORDER BY 
          t.id DESC
        LIMIT ${limit}
      `
    }

    const result = await query
    return result.rows
  } catch (error) {
    console.error("Error al obtener guías:", error)
    throw error
  }
}

// Función para obtener tickets directamente usando sql de @vercel/postgres
async function getTickets(tipo = undefined, limit = 500) {
  try {
    // Convertir tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    // Construir la consulta usando tagged template literals
    let query
    if (locationId) {
      query = sql`
        SELECT 
          t.id,
          t.fecha_documento as fecha,
          t.numero_documento as numero_guia,
          tl.ticket,
          tl.ticket2,
          c.primer_nombre || ' ' || c.primer_apellido as propietario,
          c.nit,
          p.name as tipo,
          r.name as raza,
          col.name as color,
          g.name as genero,
          tl.quantity as kilos,
          tl.valor,
          CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
          t.business_location_id
        FROM transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        LEFT JOIN products p ON tl.product_id = p.id
        LEFT JOIN razas r ON tl.raza_id = r.id
        LEFT JOIN colors col ON tl.color_id = col.id
        LEFT JOIN generos g ON tl.genero_id = g.id
        WHERE t.activo = TRUE 
          AND t.type = 'entry' 
          AND tl.ticket IS NOT NULL
          AND t.business_location_id = ${locationId}
        ORDER BY tl.ticket DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT 
          t.id,
          t.fecha_documento as fecha,
          t.numero_documento as numero_guia,
          tl.ticket,
          tl.ticket2,
          c.primer_nombre || ' ' || c.primer_apellido as propietario,
          c.nit,
          p.name as tipo,
          r.name as raza,
          col.name as color,
          g.name as genero,
          tl.quantity as kilos,
          tl.valor,
          CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
          t.business_location_id
        FROM transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        LEFT JOIN products p ON tl.product_id = p.id
        LEFT JOIN razas r ON tl.raza_id = r.id
        LEFT JOIN colors col ON tl.color_id = col.id
        LEFT JOIN generos g ON tl.genero_id = g.id
        WHERE t.activo = TRUE 
          AND t.type = 'entry' 
          AND tl.ticket IS NOT NULL
        ORDER BY tl.ticket DESC
        LIMIT ${limit}
      `
    }

    const result = await query
    console.log(`Tickets obtenidos: ${result.rows.length}`)
    return result.rows
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    throw error
  }
}

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
    // Usar la función local que usa directamente sql de @vercel/postgres
    guias = await getGuias(tipo, limit)
    console.log(`Total de guías obtenidas: ${guias.length}`)
  } catch (error) {
    console.error("Error al obtener guías:", error)
    guiasError = error.message || "Error al obtener guías"
  }

  // Obtener tickets con manejo de errores
  let tickets = []
  let ticketsError = null
  try {
    // Usar la función local que usa directamente sql de @vercel/postgres
    tickets = await getTickets(tipo, 500)
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

      {/* Alerta para la guía 154 */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Acceso directo a Guía #154</AlertTitle>
        <AlertDescription className="text-amber-700">
          Si necesita acceder específicamente a la guía #154, use este{" "}
          <Link href="/guias/editar-154" className="font-medium underline">
            enlace directo
          </Link>
          .
        </AlertDescription>
      </Alert>

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
              <TicketsTable tickets={tickets} currentLimit={limit} />
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
