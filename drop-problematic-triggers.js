// Este script elimina los triggers problemáticos en la tabla transaction_lines
// Ejecutar con: node drop-problematic-triggers.js

import { sql } from "@vercel/postgres"

async function dropProblematicTriggers() {
  try {
    console.log("Eliminando triggers problemáticos en la tabla transaction_lines...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Obtener todos los triggers de la tabla transaction_lines
    const triggersResult = await sql`
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      AND event_object_schema = 'public'
    `

    if (triggersResult.rows.length === 0) {
      console.log("No se encontraron triggers en la tabla transaction_lines")
      await sql`COMMIT`
      return
    }

    console.log(`Se encontraron ${triggersResult.rows.length} triggers:`)
    for (const trigger of triggersResult.rows) {
      console.log(`- ${trigger.trigger_name}`)
    }

    // 2. Eliminar todos los triggers encontrados
    for (const trigger of triggersResult.rows) {
      console.log(`Eliminando trigger: ${trigger.trigger_name}`)
      await sql`
        DROP TRIGGER IF EXISTS ${sql.identifier([trigger.trigger_name])} ON transaction_lines;
      `
    }

    // 3. Eliminar las funciones asociadas a los triggers
    console.log("Eliminando funciones asociadas a los triggers...")
    await sql`
      DROP FUNCTION IF EXISTS generate_ticket2();
      DROP FUNCTION IF EXISTS update_ticket2();
      DROP FUNCTION IF EXISTS before_insert_transaction_lines();
      DROP FUNCTION IF EXISTS after_insert_transaction_lines();
      DROP FUNCTION IF EXISTS before_update_transaction_lines();
      DROP FUNCTION IF EXISTS after_update_transaction_lines();
    `

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Triggers problemáticos eliminados con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al eliminar triggers problemáticos:", error)
  } finally {
    process.exit(0)
  }
}

dropProblematicTriggers()
