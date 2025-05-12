import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TicketsAgrupadosDia from "./tickets-agrupados-dia"
import TicketsAgrupadosMes from "./tickets-agrupados-mes"
import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"

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
    `

    // Verificar el rango de fechas obtenido
    if (result.rows.length > 0) {
      const fechas = result.rows.map((row) => new Date(row.fecha))
      const minFecha = new Date(Math.min(...fechas))
      const maxFecha = new Date(Math.max(...fechas))
      console.log(`Rango de fechas obtenido: ${minFecha.toISOString()} a ${maxFecha.toISOString()}`)
      console.log(`Total de tickets obtenidos: ${result.rows.length}`)
    }

    return result.rows
  } catch (error) {
    console.error("Error al obtener datos de tickets:", error)
    return []
  }
}

export default async function TicketsAgrupadosPage() {
  const tickets = await getTicketsData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tickets Agrupados</h1>
      </div>

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
    </div>
  )
}
