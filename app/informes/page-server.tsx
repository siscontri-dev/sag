import { sql } from "@vercel/postgres"
import ClientPage from "./page"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Función para obtener tickets
async function getTickets(tipo = "bovino", limit = 500) {
  try {
    // Convertir tipo de animal a business_location_id
    const locationId = tipo === "bovino" ? 1 : 2

    // Construir la consulta
    const query = sql`
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

    const result = await query
    console.log(`Tickets obtenidos: ${result.rows.length}`)
    return result.rows
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    throw error
  }
}

// Función para obtener guías
async function getGuias(tipo = "bovino", limit = 100) {
  try {
    // Convertir tipo de animal a business_location_id
    const locationId = tipo === "bovino" ? 1 : 2

    // Construir la consulta
    const query = sql`
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

    const result = await query
    console.log(`Guías obtenidas: ${result.rows.length}`)
    return result.rows
  } catch (error) {
    console.error("Error al obtener guías:", error)
    throw error
  }
}

export default async function InformesPageServer({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    categoria?: string
    informe?: string
  }
}) {
  const tipo = searchParams.tipo || "bovino"
  const informe = searchParams.informe || "tickets"

  // Obtener datos según el informe seleccionado
  const data = {}

  try {
    if (informe === "tickets" || informe === "tickets-agrupados") {
      data.tickets = await getTickets(tipo)
    } else if (informe === "guias" || informe === "guias-propietario") {
      data.guias = await getGuias(tipo)
    }
  } catch (error) {
    console.error(`Error al cargar datos para ${informe}:`, error)
    data.error = error.message
  }

  // Pasar los datos al componente cliente
  return <ClientPage searchParams={searchParams} data={data} />
}
