import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { themeColors } from "@/lib/theme-config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { sql } from "@vercel/postgres"
import TicketsTable from "./tickets-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
    console.log(`Tickets obtenidos antes de procesar: ${result.rows.length}`)

    // Devolver los datos sin procesar para mantener las fechas originales
    return result.rows
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    throw error
  }
}

export default async function TicketsListadoPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    limit?: string
    fechaDesde?: string
    fechaHasta?: string
    estado?: string
  }
}) {
  // Añadir al inicio de la función, después de obtener los parámetros
  console.log("Parámetros de búsqueda recibidos:", searchParams)

  const tipo = searchParams.tipo || undefined
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit) : 100
  const fechaDesde = searchParams.fechaDesde || undefined
  const fechaHasta = searchParams.fechaHasta || undefined
  const estado = searchParams.estado || undefined

  // Obtener tickets con manejo de errores
  let tickets = []
  let ticketsError = null
  try {
    // Usar la función local que usa directamente sql de @vercel/postgres
    tickets = await getTickets(tipo, 500)
    console.log(`Total de tickets obtenidos: ${tickets.length}`)

    // Imprimir algunas fechas para depuración
    if (tickets.length > 0) {
      console.log("Muestra de fechas de tickets:")
      for (let i = 0; i < Math.min(5, tickets.length); i++) {
        console.log(`Ticket ${i + 1}: ${tickets[i].id}, Fecha: ${tickets[i].fecha}`)
      }
    }
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    ticketsError = error.message || "Error al obtener tickets"
  }

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
            <Link href="/informes/listados">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Listado de Tickets {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
      </div>

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
    </div>
  )
}
