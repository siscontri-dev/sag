import { sql } from "@vercel/postgres"

// Interfaz para el contador de tickets adaptada a tu estructura de tabla
interface TicketCounter {
  id?: number
  location_id: number
  current_ticket: number
  last_reset: Date
  manual_reset?: boolean
  fecha_creacion?: Date
  fecha_actualizacion?: Date
}

// Función para verificar si la columna manual_reset existe
async function checkManualResetColumnExists(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ticket_counters' 
      AND column_name = 'manual_reset'
    `
    return result.rows.length > 0
  } catch (error) {
    console.error("Error al verificar columna manual_reset:", error)
    return false
  }
}

// Función para obtener el último ticket registrado en transaction_lines para una ubicación
// Solo considera tickets del mes actual
async function getLastTicketFromTransactionLines(locationId: number): Promise<number> {
  try {
    console.log(`Buscando último ticket en transaction_lines para location_id: ${locationId}`)

    // Obtener el primer día del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthStr = firstDayOfMonth.toISOString()

    console.log(`Buscando tickets desde: ${firstDayOfMonthStr}`)

    // Consultar el último ticket registrado en transaction_lines para esta ubicación
    // Solo del mes actual
    const result = await sql`
      SELECT MAX(tl.ticket) as last_ticket
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.business_location_id = ${locationId}
        AND t.activo = TRUE
        AND t.fecha_creacion >= ${firstDayOfMonthStr}
    `

    if (result.rows.length > 0 && result.rows[0].last_ticket) {
      const lastTicket = Number(result.rows[0].last_ticket)
      console.log(`Último ticket encontrado en transaction_lines del mes actual: ${lastTicket}`)
      return lastTicket
    }

    console.log(`No se encontraron tickets en transaction_lines para location_id: ${locationId} en el mes actual`)
    return 0
  } catch (error) {
    console.error("Error al obtener último ticket de transaction_lines:", error)
    return 0
  }
}

// Función para verificar si hubo un reinicio manual
async function wasManuallyReset(locationId: number): Promise<boolean> {
  try {
    // Verificar si la columna manual_reset existe
    const columnExists = await checkManualResetColumnExists()

    if (!columnExists) {
      console.log("La columna manual_reset no existe, asumiendo que no hubo reinicio manual")
      return false
    }

    const result = await sql`
      SELECT manual_reset
      FROM ticket_counters
      WHERE location_id = ${locationId}
    `

    if (result.rows.length > 0 && result.rows[0].manual_reset) {
      return true
    }
    return false
  } catch (error) {
    console.error("Error al verificar reinicio manual:", error)
    return false
  }
}

// Función para obtener el contador actual de tickets
export async function getCurrentTicketCount(locationId: number): Promise<number> {
  try {
    console.log(`Obteniendo contador actual para location_id: ${locationId}`)

    // Verificar si la columna manual_reset existe
    const columnExists = await checkManualResetColumnExists()
    console.log(`Columna manual_reset existe: ${columnExists}`)

    // Consulta SQL adaptada según si existe la columna
    let result
    if (columnExists) {
      result = await sql`
        SELECT current_ticket, last_reset, manual_reset
        FROM ticket_counters 
        WHERE location_id = ${locationId}
      `
    } else {
      result = await sql`
        SELECT current_ticket, last_reset
        FROM ticket_counters 
        WHERE location_id = ${locationId}
      `
    }

    if (result.rows.length > 0) {
      const currentTicket = Number(result.rows[0].current_ticket)
      const manualReset = columnExists ? result.rows[0].manual_reset : false

      console.log(`Contador en ticket_counters: ${currentTicket}, Reinicio manual: ${manualReset}`)

      // Si hubo un reinicio manual, usar el valor del contador directamente
      if (manualReset) {
        return currentTicket
      }

      // Si no hubo reinicio manual, verificar el último ticket en transaction_lines
      const lastTicketFromDB = await getLastTicketFromTransactionLines(locationId)

      // Usar el valor más alto entre el contador y el último ticket de la base de datos
      const finalTicket = Math.max(currentTicket, lastTicketFromDB)

      // Si el último ticket de la base de datos es mayor, actualizar el contador
      if (lastTicketFromDB > currentTicket) {
        console.log(`Actualizando contador a ${lastTicketFromDB} basado en el último ticket de transaction_lines`)
        await sql`
          UPDATE ticket_counters
          SET current_ticket = ${lastTicketFromDB},
              fecha_actualizacion = ${new Date().toISOString()}
          WHERE location_id = ${locationId}
        `
      }

      return finalTicket
    }

    console.log(`No se encontró contador para location_id: ${locationId}, creando uno nuevo`)

    // Si no existe contador, verificar el último ticket en transaction_lines
    const lastTicketFromDB = await getLastTicketFromTransactionLines(locationId)

    // Crear un nuevo contador con el valor del último ticket
    const currentDate = new Date()

    // Consulta SQL adaptada según si existe la columna
    if (columnExists) {
      await sql`
        INSERT INTO ticket_counters (
          location_id, 
          current_ticket, 
          last_reset,
          manual_reset,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (
          ${locationId},
          ${lastTicketFromDB},
          ${currentDate.toISOString()},
          FALSE,
          ${currentDate.toISOString()},
          ${currentDate.toISOString()}
        )
      `
    } else {
      await sql`
        INSERT INTO ticket_counters (
          location_id, 
          current_ticket, 
          last_reset,
          fecha_creacion,
          fecha_actualizacion
        ) VALUES (
          ${locationId},
          ${lastTicketFromDB},
          ${currentDate.toISOString()},
          ${currentDate.toISOString()},
          ${currentDate.toISOString()}
        )
      `
    }

    return lastTicketFromDB
  } catch (error) {
    console.error("Error al obtener contador de tickets:", error)
    throw error
  }
}

// Función para obtener el siguiente número de ticket
export async function getNextTicketNumber(locationId: number): Promise<number> {
  try {
    console.log(`Obteniendo siguiente ticket para location_id: ${locationId}`)

    // Verificar si la columna manual_reset existe
    const columnExists = await checkManualResetColumnExists()
    console.log(`Columna manual_reset existe: ${columnExists}`)

    // Iniciar una transacción para asegurar la atomicidad
    await sql`BEGIN`

    // Consulta SQL adaptada según si existe la columna
    let result
    if (columnExists) {
      result = await sql`
        SELECT id, current_ticket, last_reset, manual_reset
        FROM ticket_counters 
        WHERE location_id = ${locationId}
        FOR UPDATE
      `
    } else {
      result = await sql`
        SELECT id, current_ticket, last_reset
        FROM ticket_counters 
        WHERE location_id = ${locationId}
        FOR UPDATE
      `
    }

    let nextTicket = 1
    let baseTicket = 0
    const currentDate = new Date()

    if (result.rows.length === 0) {
      // Si no existe el contador, verificar el último ticket en transaction_lines
      const lastTicketFromDB = await getLastTicketFromTransactionLines(locationId)
      nextTicket = lastTicketFromDB + 1
      console.log(`No se encontró contador, usando último ticket de DB + 1: ${nextTicket}`)

      // Crear un nuevo contador
      if (columnExists) {
        await sql`
          INSERT INTO ticket_counters (
            location_id, 
            current_ticket, 
            last_reset,
            manual_reset,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${locationId},
            ${nextTicket},
            ${currentDate.toISOString()},
            FALSE,
            ${currentDate.toISOString()},
            ${currentDate.toISOString()}
          )
        `
      } else {
        await sql`
          INSERT INTO ticket_counters (
            location_id, 
            current_ticket, 
            last_reset,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${locationId},
            ${nextTicket},
            ${currentDate.toISOString()},
            ${currentDate.toISOString()},
            ${currentDate.toISOString()}
          )
        `
      }
    } else {
      // Si existe el contador
      const counterId = result.rows[0].id
      const currentCounter = Number(result.rows[0].current_ticket)
      const manualReset = columnExists ? result.rows[0].manual_reset : false

      console.log(`Contador existente: ${currentCounter}, Reinicio manual: ${manualReset}`)

      if (manualReset) {
        // Si hubo un reinicio manual, usar directamente el contador + 1
        baseTicket = currentCounter
        nextTicket = currentCounter + 1
        console.log(`Reinicio manual detectado, usando contador + 1: ${nextTicket}`)

        // Actualizar el contador
        await sql`
          UPDATE ticket_counters 
          SET current_ticket = ${nextTicket}, 
              fecha_actualizacion = ${currentDate.toISOString()}
          WHERE id = ${counterId}
        `
      } else {
        // Si no hubo reinicio manual, verificar el último ticket en transaction_lines
        const lastTicketFromDB = await getLastTicketFromTransactionLines(locationId)
        console.log(`Último ticket en DB: ${lastTicketFromDB}, Contador actual: ${currentCounter}`)

        // Usar el valor más alto entre el contador y el último ticket de la base de datos
        baseTicket = Math.max(currentCounter, lastTicketFromDB)
        nextTicket = baseTicket + 1
        console.log(`Usando el valor más alto + 1: ${nextTicket}`)

        // Actualizar el contador
        await sql`
          UPDATE ticket_counters 
          SET current_ticket = ${nextTicket}, 
              fecha_actualizacion = ${currentDate.toISOString()}
          WHERE id = ${counterId}
        `
      }
    }

    console.log(`Contador actualizado a: ${nextTicket}`)

    // Confirmar la transacción
    await sql`COMMIT`

    return nextTicket
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al obtener siguiente número de ticket:", error)
    throw error
  }
}

// Función para reiniciar el contador de tickets
export async function resetTicketCounter(locationId: number): Promise<boolean> {
  try {
    console.log(`Reiniciando contador para location_id: ${locationId}`)
    const currentDate = new Date()

    // Verificar si la columna manual_reset existe
    const columnExists = await checkManualResetColumnExists()
    console.log(`Columna manual_reset existe: ${columnExists}`)

    // Iniciar una transacción para asegurar la atomicidad
    await sql`BEGIN`

    // Verificar si existe un contador para esta ubicación
    const result = await sql`
      SELECT id
      FROM ticket_counters 
      WHERE location_id = ${locationId}
      FOR UPDATE
    `

    if (result.rows.length > 0) {
      // Si existe, reiniciarlo a 0 y marcar como reinicio manual si la columna existe
      const counterId = result.rows[0].id

      if (columnExists) {
        await sql`
          UPDATE ticket_counters 
          SET current_ticket = 0, 
              last_reset = ${currentDate.toISOString()},
              manual_reset = TRUE,
              fecha_actualizacion = ${currentDate.toISOString()}
          WHERE id = ${counterId}
        `
      } else {
        await sql`
          UPDATE ticket_counters 
          SET current_ticket = 0, 
              last_reset = ${currentDate.toISOString()},
              fecha_actualizacion = ${currentDate.toISOString()}
          WHERE id = ${counterId}
        `
      }
    } else {
      // Si no existe, crearlo con valor 0 y marcar como reinicio manual si la columna existe
      if (columnExists) {
        await sql`
          INSERT INTO ticket_counters (
            location_id, 
            current_ticket, 
            last_reset,
            manual_reset,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${locationId},
            0,
            ${currentDate.toISOString()},
            TRUE,
            ${currentDate.toISOString()},
            ${currentDate.toISOString()}
          )
        `
      } else {
        await sql`
          INSERT INTO ticket_counters (
            location_id, 
            current_ticket, 
            last_reset,
            fecha_creacion,
            fecha_actualizacion
          ) VALUES (
            ${locationId},
            0,
            ${currentDate.toISOString()},
            ${currentDate.toISOString()},
            ${currentDate.toISOString()}
          )
        `
      }
    }

    // Confirmar la transacción
    await sql`COMMIT`

    console.log(`Contador reiniciado correctamente para location_id: ${locationId}`)
    return true
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al reiniciar contador de tickets:", error)
    return false
  }
}

// Función para reiniciar el flag de reinicio manual al inicio de cada mes
export async function resetManualResetFlag(): Promise<boolean> {
  try {
    console.log(`Reiniciando flags de reinicio manual para todos los contadores`)

    // Verificar si la columna manual_reset existe
    const columnExists = await checkManualResetColumnExists()

    if (!columnExists) {
      console.log("La columna manual_reset no existe, no se puede reiniciar el flag")
      return false
    }

    const currentDate = new Date()

    await sql`
      UPDATE ticket_counters 
      SET manual_reset = FALSE,
          fecha_actualizacion = ${currentDate.toISOString()}
    `

    console.log(`Flags de reinicio manual reiniciados correctamente`)
    return true
  } catch (error) {
    console.error("Error al reiniciar flags de reinicio manual:", error)
    return false
  }
}
