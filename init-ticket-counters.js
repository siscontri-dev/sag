import { sql } from "@vercel/postgres"

async function initTicketCounters() {
  try {
    console.log("Inicializando contadores de tickets...")

    // Verificar si ya existen registros
    const existingResult = await sql`
      SELECT COUNT(*) as count FROM ticket_counters
    `

    if (existingResult.rows[0].count > 0) {
      console.log(`Ya existen ${existingResult.rows[0].count} registros en la tabla ticket_counters.`)

      // Mostrar los registros existentes
      const countersResult = await sql`
        SELECT * FROM ticket_counters
      `
      console.log("Registros existentes:")
      console.log(countersResult.rows)
      return
    }

    // Insertar contadores iniciales para las ubicaciones 1 (Bovinos) y 2 (Porcinos)
    const currentDate = new Date().toISOString()

    await sql`
      INSERT INTO ticket_counters (
        location_id, 
        current_ticket, 
        last_reset,
        fecha_creacion,
        fecha_actualizacion
      ) VALUES 
      (1, 0, ${currentDate}, ${currentDate}, ${currentDate}),
      (2, 0, ${currentDate}, ${currentDate}, ${currentDate})
    `

    console.log("Contadores inicializados correctamente para las ubicaciones 1 y 2.")

    // Verificar los registros insertados
    const result = await sql`
      SELECT * FROM ticket_counters
    `
    console.log("Registros insertados:")
    console.log(result.rows)
  } catch (error) {
    console.error("Error al inicializar contadores de tickets:", error)
  }
}

initTicketCounters()
