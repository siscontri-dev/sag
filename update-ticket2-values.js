// Este script actualiza los valores de ticket2 basados en ticket
// Ejecutar con: node update-ticket2-values.js

import { sql } from "@vercel/postgres"

async function updateTicket2Values() {
  try {
    console.log("Actualizando valores de ticket2 basados en ticket...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Verificar si la columna ticket2 existe
    const columnCheckResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket2'
    `

    if (columnCheckResult.rows.length === 0) {
      console.log("La columna ticket2 no existe, creándola...")
      await sql`
        ALTER TABLE transaction_lines ADD COLUMN ticket2 INTEGER;
      `
    }

    // 2. Verificar el tipo de la columna ticket
    const ticketTypeResult = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket'
    `

    const ticketType = ticketTypeResult.rows[0]?.data_type?.toLowerCase()
    console.log(`Tipo de la columna ticket: ${ticketType}`)

    // 3. Actualizar ticket2 basado en ticket
    if (ticketType === "text") {
      // Si ticket es TEXT, convertir a INTEGER para ticket2
      await sql`
        UPDATE transaction_lines
        SET ticket2 = CASE
          WHEN ticket ~ '^[0-9]+$' THEN CAST(ticket AS INTEGER)
          ELSE 0
        END
        WHERE ticket IS NOT NULL;
      `
    } else {
      // Si ticket es INTEGER, simplemente copiar el valor
      await sql`
        UPDATE transaction_lines
        SET ticket2 = ticket
        WHERE ticket IS NOT NULL;
      `
    }

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Valores de ticket2 actualizados con éxito")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al actualizar valores de ticket2:", error)
  } finally {
    process.exit(0)
  }
}

updateTicket2Values()
