// Este script corrige el tipo de la columna ticket en transaction_lines
// Ejecutar con: node fix-ticket-column-type.js

import { sql } from "@vercel/postgres"

async function fixTicketColumnType() {
  try {
    console.log("Iniciando corrección del tipo de columna ticket...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Desactivar todos los triggers
    await sql`ALTER TABLE transaction_lines DISABLE TRIGGER ALL;`

    // 2. Verificar el tipo actual de la columna ticket
    const columnTypeResult = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket'
    `

    if (columnTypeResult.rows.length === 0) {
      console.log("La columna ticket no existe en la tabla transaction_lines")
      await sql`ROLLBACK`
      return
    }

    const currentType = columnTypeResult.rows[0].data_type
    console.log(`Tipo actual de la columna ticket: ${currentType}`)

    // 3. Si la columna es de tipo TEXT, convertirla a INTEGER
    if (currentType.toLowerCase() === "text") {
      console.log("Convirtiendo la columna ticket de TEXT a INTEGER...")

      // Crear una columna temporal para almacenar los valores convertidos
      await sql`
        ALTER TABLE transaction_lines ADD COLUMN ticket_temp INTEGER;
      `

      // Actualizar la columna temporal con los valores convertidos
      await sql`
        UPDATE transaction_lines
        SET ticket_temp = CASE
          WHEN ticket ~ '^[0-9]+$' THEN CAST(ticket AS INTEGER)
          ELSE 0
        END
        WHERE ticket IS NOT NULL;
      `

      // Eliminar la columna original
      await sql`
        ALTER TABLE transaction_lines DROP COLUMN ticket;
      `

      // Renombrar la columna temporal
      await sql`
        ALTER TABLE transaction_lines RENAME COLUMN ticket_temp TO ticket;
      `

      console.log("Columna ticket convertida a INTEGER con éxito")
    } else {
      console.log("La columna ticket ya es de tipo INTEGER, no es necesario convertirla")
    }

    // 4. Asegurarse de que la columna ticket2 existe y es de tipo INTEGER
    const ticket2Result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket2'
    `

    if (ticket2Result.rows.length === 0) {
      console.log("La columna ticket2 no existe, creándola...")
      await sql`
        ALTER TABLE transaction_lines ADD COLUMN ticket2 INTEGER;
      `

      // Actualizar ticket2 con los valores de ticket
      await sql`
        UPDATE transaction_lines
        SET ticket2 = ticket
        WHERE ticket IS NOT NULL;
      `
    }

    // 5. Volver a activar los triggers
    await sql`ALTER TABLE transaction_lines ENABLE TRIGGER ALL;`

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Corrección del tipo de columna ticket completada con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al corregir el tipo de columna ticket:", error)
  } finally {
    process.exit(0)
  }
}

fixTicketColumnType()
