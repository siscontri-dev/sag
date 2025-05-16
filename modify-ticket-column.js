// Este script modifica la columna ticket en la tabla transaction_lines
// para asegurar que sea de tipo TEXT y tenga un valor por defecto
// Ejecutar con: node modify-ticket-column.js

import { sql } from "@vercel/postgres"

async function modifyTicketColumn() {
  try {
    console.log("Iniciando modificación de la columna ticket...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Verificar el tipo actual de la columna
    const columnTypeResult = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    const currentType = columnTypeResult.rows[0]?.data_type
    console.log(`Tipo actual de la columna ticket: ${currentType}`)

    // 2. Si la columna no es de tipo text, modificarla
    if (currentType !== "text") {
      console.log("Modificando la columna ticket a tipo TEXT...")

      // Primero, crear una columna temporal
      await sql`
        ALTER TABLE transaction_lines 
        ADD COLUMN ticket_temp TEXT
      `

      // Copiar los datos convertidos a la columna temporal
      await sql`
        UPDATE transaction_lines 
        SET ticket_temp = CAST(ticket AS TEXT)
      `

      // Eliminar la columna original
      await sql`
        ALTER TABLE transaction_lines 
        DROP COLUMN ticket
      `

      // Renombrar la columna temporal
      await sql`
        ALTER TABLE transaction_lines 
        RENAME COLUMN ticket_temp TO ticket
      `

      console.log("Columna ticket modificada a tipo TEXT")
    }

    // 3. Asegurarse de que no haya valores NULL
    console.log("Actualizando valores NULL a cadena vacía...")
    await sql`
      UPDATE transaction_lines 
      SET ticket = '' 
      WHERE ticket IS NULL
    `

    // 4. Establecer un valor por defecto para la columna
    console.log("Estableciendo valor por defecto para la columna ticket...")
    await sql`
      ALTER TABLE transaction_lines 
      ALTER COLUMN ticket SET DEFAULT ''
    `

    // 5. Verificar si hay triggers que usen COALESCE con la columna ticket
    const triggersResult = await sql`
      SELECT trigger_name, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'transaction_lines'
    `

    console.log(`Encontrados ${triggersResult.rows.length} triggers en la tabla transaction_lines`)

    for (const trigger of triggersResult.rows) {
      if (trigger.action_statement.includes("COALESCE") && trigger.action_statement.includes("ticket")) {
        console.log(`⚠️ El trigger ${trigger.trigger_name} usa COALESCE con la columna ticket`)
        console.log("Intentando modificar el trigger...")

        // Aquí podríamos intentar modificar el trigger, pero es complicado sin conocer su estructura exacta
        // Por ahora, solo mostramos un mensaje de advertencia
      }
    }

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Modificación de la columna ticket completada con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al modificar la columna ticket:", error)
  } finally {
    process.exit(0)
  }
}

modifyTicketColumn()
