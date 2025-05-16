import { sql } from "@vercel/postgres"

async function convertTicketToInteger() {
  try {
    console.log("Iniciando conversión de columna ticket a INTEGER...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Verificar si la columna ticket2 existe, si no, crearla
    const ticket2Check = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' 
      AND column_name = 'ticket2'
    `

    if (ticket2Check.rows.length === 0) {
      console.log("Creando columna ticket2...")
      await sql`ALTER TABLE transaction_lines ADD COLUMN ticket2 INTEGER`
    }

    // 2. Actualizar ticket2 con valores numéricos de ticket
    console.log("Actualizando valores de ticket2...")
    await sql`
      UPDATE transaction_lines 
      SET ticket2 = CASE 
        WHEN ticket ~ E'^\\d+$' THEN ticket::INTEGER 
        ELSE 0 
      END
    `

    // 3. Crear una columna temporal para la conversión
    console.log("Creando columna temporal...")
    await sql`ALTER TABLE transaction_lines ADD COLUMN ticket_temp INTEGER`

    // 4. Convertir valores de ticket a INTEGER en la columna temporal
    console.log("Convirtiendo valores a INTEGER...")
    await sql`
      UPDATE transaction_lines 
      SET ticket_temp = CASE 
        WHEN ticket ~ E'^\\d+$' THEN ticket::INTEGER 
        ELSE 0 
      END
    `

    // 5. Eliminar la columna ticket original
    console.log("Eliminando columna ticket original...")
    await sql`ALTER TABLE transaction_lines DROP COLUMN ticket`

    // 6. Renombrar la columna temporal a ticket
    console.log("Renombrando columna temporal a ticket...")
    await sql`ALTER TABLE transaction_lines RENAME COLUMN ticket_temp TO ticket`

    // 7. Confirmar la transacción
    await sql`COMMIT`

    console.log("Conversión completada con éxito.")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error durante la conversión:", error)
  }
}

convertTicketToInteger()
