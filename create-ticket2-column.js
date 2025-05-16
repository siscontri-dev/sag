// Este script crea la columna ticket2 si no existe
// Ejecutar con: node create-ticket2-column.js

import { sql } from "@vercel/postgres"

async function createTicket2Column() {
  try {
    console.log("Verificando si existe la columna ticket2...")

    // Verificar si la columna ticket2 existe
    const columnCheckResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket2'
    `

    if (columnCheckResult.rows.length > 0) {
      console.log("La columna ticket2 ya existe")
      return
    }

    console.log("La columna ticket2 no existe. Creándola...")

    // Crear la columna ticket2
    await sql`
      ALTER TABLE transaction_lines
      ADD COLUMN ticket2 INTEGER;
    `

    console.log("Columna ticket2 creada con éxito")

    // Actualizar los valores de ticket2 basados en ticket
    console.log("Actualizando valores de ticket2 basados en ticket...")
    await sql`
      UPDATE transaction_lines
      SET ticket2 = CASE 
        WHEN ticket ~ E'^\\d+$' THEN ticket::INTEGER
        ELSE 0
      END
      WHERE ticket IS NOT NULL;
    `

    console.log("Valores de ticket2 actualizados con éxito")
  } catch (error) {
    console.error("Error al crear o actualizar la columna ticket2:", error)
  } finally {
    process.exit(0)
  }
}

createTicket2Column()
