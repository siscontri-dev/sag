// Este script actualiza los valores de ticket2 basados en ticket
// Ejecutar con: node update-ticket2-from-ticket.js

import { sql } from "@vercel/postgres"

async function updateTicket2FromTicket() {
  try {
    console.log("Verificando si existe la columna ticket2...")

    // Verificar si la columna ticket2 existe
    const columnCheckResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket2'
    `

    if (columnCheckResult.rows.length === 0) {
      console.log("La columna ticket2 no existe. Creándola...")
      await sql`
        ALTER TABLE transaction_lines
        ADD COLUMN ticket2 INTEGER;
      `
      console.log("Columna ticket2 creada con éxito")
    } else {
      console.log("La columna ticket2 ya existe")
    }

    // Verificar el tipo de la columna ticket
    const ticketTypeResult = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket'
    `

    const ticketType = ticketTypeResult.rows[0].data_type.toLowerCase()
    console.log(`El tipo de la columna ticket es: ${ticketType}`)

    // Actualizar los valores de ticket2 basados en ticket
    console.log("Actualizando valores de ticket2 basados en ticket...")

    if (ticketType === "text") {
      await sql`
        UPDATE transaction_lines
        SET ticket2 = CASE 
          WHEN ticket ~ E'^\\d+$' THEN ticket::INTEGER
          ELSE 0
        END
        WHERE ticket IS NOT NULL;
      `
    } else if (ticketType === "integer") {
      await sql`
        UPDATE transaction_lines
        SET ticket2 = ticket
        WHERE ticket IS NOT NULL;
      `
    } else {
      console.log(`No se puede actualizar ticket2 porque ticket es de tipo ${ticketType}`)
      return
    }

    console.log("Valores de ticket2 actualizados con éxito")
  } catch (error) {
    console.error("Error al actualizar ticket2:", error)
  } finally {
    process.exit(0)
  }
}

updateTicket2FromTicket()
