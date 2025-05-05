import { sql } from "@vercel/postgres"

async function syncTicketCounters() {
  try {
    console.log("Sincronizando contadores de tickets con los últimos tickets registrados...")

    // Obtener todas las ubicaciones (business_location_id) que tienen tickets
    const locationsResult = await sql`
      SELECT DISTINCT business_location_id
      FROM transactions
      WHERE activo = TRUE
    `

    if (locationsResult.rows.length === 0) {
      console.log("No se encontraron ubicaciones con transacciones activas.")
      return
    }

    console.log(`Encontradas ${locationsResult.rows.length} ubicaciones con transacciones.`)

    // Para cada ubicación, obtener el último ticket y actualizar el contador
    for (const locationRow of locationsResult.rows) {
      const locationId = locationRow.business_location_id

      // Obtener el último ticket para esta ubicación
      const lastTicketResult = await sql`
        SELECT MAX(tl.ticket) as last_ticket
        FROM transaction_lines tl
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.business_location_id = ${locationId}
          AND t.activo = TRUE
      `

      const lastTicket = lastTicketResult.rows[0].last_ticket || 0
      console.log(`Ubicación ${locationId}: Último ticket = ${lastTicket}`)

      // Verificar si existe un contador para esta ubicación
      const counterResult = await sql`
        SELECT id, current_ticket
        FROM ticket_counters
        WHERE location_id = ${locationId}
      `

      const currentDate = new Date().toISOString()

      if (counterResult.rows.length > 0) {
        const counterId = counterResult.rows[0].id
        const currentCounter = counterResult.rows[0].current_ticket

        // Actualizar el contador solo si el último ticket es mayor
        if (lastTicket > currentCounter) {
          console.log(`Actualizando contador para ubicación ${locationId} de ${currentCounter} a ${lastTicket}`)
          await sql`
            UPDATE ticket_counters
            SET current_ticket = ${lastTicket},
                fecha_actualizacion = ${currentDate}
            WHERE id = ${counterId}
          `
        } else {
          console.log(
            `El contador actual (${currentCounter}) ya es mayor o igual que el último ticket (${lastTicket}). No se requiere actualización.`,
          )
        }
      } else {
        // Crear un nuevo contador con el valor del último ticket
        console.log(`Creando nuevo contador para ubicación ${locationId} con valor ${lastTicket}`)
        await sql`
          INSERT INTO ticket_counters (
            location_id,
            current_ticket,
            last_reset,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${locationId},
            ${lastTicket},
            ${currentDate},
            ${currentDate},
            ${currentDate}
          )
        `
      }
    }

    console.log("Sincronización de contadores completada.")

    // Mostrar el estado actual de los contadores
    const countersResult = await sql`
      SELECT tc.location_id, tc.current_ticket, tc.last_reset
      FROM ticket_counters tc
      ORDER BY tc.location_id
    `

    console.log("\nEstado actual de los contadores:")
    countersResult.rows.forEach((counter) => {
      console.log(
        `Ubicación ${counter.location_id}: Contador = ${counter.current_ticket}, Último reinicio = ${counter.last_reset}`,
      )
    })
  } catch (error) {
    console.error("Error al sincronizar contadores de tickets:", error)
  }
}

syncTicketCounters()
