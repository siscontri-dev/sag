import { sql } from "@vercel/postgres"

async function dropTicketTriggers() {
  try {
    console.log("Buscando triggers en la tabla transaction_lines...")

    // Obtener todos los triggers de la tabla transaction_lines
    const triggers = await sql`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
    `

    if (triggers.rows.length === 0) {
      console.log("No se encontraron triggers en la tabla transaction_lines.")
      return
    }

    console.log(`Se encontraron ${triggers.rows.length} triggers para eliminar.`)

    // Iniciar una transacción
    await sql`BEGIN`

    // Eliminar cada trigger
    for (const trigger of triggers.rows) {
      const triggerName = trigger.trigger_name
      console.log(`Eliminando trigger: ${triggerName}`)

      try {
        await sql`DROP TRIGGER IF EXISTS ${sql(triggerName)} ON transaction_lines`
        console.log(`Trigger ${triggerName} eliminado con éxito.`)
      } catch (triggerError) {
        console.error(`Error al eliminar trigger ${triggerName}:`, triggerError)
        throw triggerError
      }
    }

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Todos los triggers han sido eliminados con éxito.")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al eliminar triggers:", error)
  }
}

dropTicketTriggers()
