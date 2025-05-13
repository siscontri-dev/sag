import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TicketsAgrupadosDia from "./tickets-agrupados-dia"
import TicketsAgrupadosMes from "./tickets-agrupados-mes"
import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

async function getTicketsData() {
  noStore()
  try {
    // Obtener todos los tickets para procesarlos en el cliente
    // IMPORTANTE: Eliminamos cualquier filtro de fecha y aseguramos que traiga TODOS los tickets
    const result = await sql`
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
        AND tl.activo = TRUE
      ORDER BY t.fecha_documento DESC
      LIMIT 1000
    `

    // Verificar el rango de fechas obtenido
    if (result.rows.length > 0) {
      const fechasValidas = result.rows
        .filter((row) => row.fecha && !isNaN(new Date(row.fecha).getTime()))
        .map((row) => new Date(row.fecha))

      if (fechasValidas.length > 0) {
        const minFecha = new Date(Math.min(...fechasValidas))
        const maxFecha = new Date(Math.max(...fechasValidas))
        console.log(`Rango de fechas obtenido: ${minFecha.toISOString()} a ${maxFecha.toISOString()}`)
        console.log(`Total de tickets obtenidos: ${result.rows.length}`)
        console.log(`Tickets con fechas válidas: ${fechasValidas.length}`)
      } else {
        console.warn("No se encontraron fechas válidas en los tickets")
      }
    }

    // Normalizar las fechas en los resultados
    const normalizedRows = result.rows.map((row) => {
      try {
        if (row.fecha) {
          const fecha = new Date(row.fecha)
          // Verificar si la fecha es válida
          if (!isNaN(fecha.getTime())) {
            // La fecha es válida, no hacer nada
          } else {
            console.warn(`Fecha inválida en ticket ${row.id}: ${row.fecha}`)
            row.fecha = null // Establecer como null si es inválida
          }
        }
        return row
      } catch (error) {
        console.error(`Error al procesar fecha en ticket ${row.id}:`, error)
        row.fecha = null
        return row
      }
    })

    return { tickets: normalizedRows, error: null }
  } catch (error) {
    console.error("Error al obtener datos de tickets:", error)
    return { tickets: [], error: error.message || "Error al obtener datos de tickets" }
  }
}

export default async function TicketsAgrupadosPage() {
  const { tickets, error } = await getTicketsData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tickets Agrupados</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tickets.length === 0 && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin datos</AlertTitle>
          <AlertDescription>No se encontraron tickets para mostrar.</AlertDescription>
        </Alert>
      )}

      {tickets.length > 0 && (
        <Tabs defaultValue="dia" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="dia">Agrupar por Día</TabsTrigger>
            <TabsTrigger value="mes">Agrupar por Mes</TabsTrigger>
          </TabsList>

          <TabsContent value="dia">
            <TicketsAgrupadosDia tickets={tickets} />
          </TabsContent>

          <TabsContent value="mes">
            <TicketsAgrupadosMes tickets={tickets} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
