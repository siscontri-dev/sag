import { sql } from "@vercel/postgres"

async function disableTicketTriggers() {
  try {
    console.log("Iniciando desactivación de triggers para la columna ticket...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Verificar si existen triggers en la tabla transaction_lines
    const triggersResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      ORDER BY trigger_name
    `

    console.log(`Se encontraron ${triggersResult.rows.length} triggers en la tabla transaction_lines:`)

    for (const trigger of triggersResult.rows) {
      console.log(`- ${trigger.trigger_name}: ${trigger.event_manipulation} - ${trigger.action_statement}`)

      // 2. Eliminar los triggers que puedan estar modificando la columna ticket
      await sql`
        DROP TRIGGER IF EXISTS ${sql.identifier(trigger.trigger_name)} ON transaction_lines
      `
      console.log(`  Trigger ${trigger.trigger_name} eliminado.`)
    }

    // 3. Verificar si la columna ticket tiene algún valor por defecto o restricción
    const columnInfoResult = await sql`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines' AND column_name IN ('ticket', 'ticket2')
    `

    console.log("\nInformación de las columnas ticket y ticket2:")
    for (const column of columnInfoResult.rows) {
      console.log(`- ${column.column_name}: Default=${column.column_default || "NULL"}, Nullable=${column.is_nullable}`)

      // 4. Eliminar cualquier valor por defecto en las columnas ticket y ticket2
      if (column.column_default) {
        await sql`
          ALTER TABLE transaction_lines ALTER COLUMN ${sql.identifier(column.column_name)} DROP DEFAULT
        `
        console.log(`  Valor por defecto eliminado de la columna ${column.column_name}.`)
      }
    }

    // 5. Verificar si hay secuencias asociadas a la tabla
    const sequencesResult = await sql`
      SELECT c.relname AS sequence_name
      FROM pg_class c
      JOIN pg_depend d ON d.objid = c.oid
      JOIN pg_class t ON t.oid = d.refobjid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
      WHERE c.relkind = 'S' AND t.relname = 'transaction_lines'
      AND a.attname IN ('ticket', 'ticket2')
    `

    console.log("\nSecuencias asociadas a las columnas ticket y ticket2:")
    if (sequencesResult.rows.length === 0) {
      console.log("No se encontraron secuencias asociadas.")
    } else {
      for (const seq of sequencesResult.rows) {
        console.log(`- ${seq.sequence_name}`)
      }
    }

    // 6. Confirmar la transacción
    await sql`COMMIT`

    console.log(
      "\n✅ Proceso completado. Se han desactivado los mecanismos que podrían modificar automáticamente los valores de ticket.",
    )
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("❌ Error al desactivar triggers:", error)
  }
}

// Ejecutar la función
disableTicketTriggers()
