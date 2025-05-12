import { sql } from "@vercel/postgres"

async function checkTicketColumnDefinition() {
  try {
    console.log("Verificando definición de la columna ticket en transaction_lines...")

    // Consultar la definición de la columna ticket
    const columnResult = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    if (columnResult.rows.length === 0) {
      console.log("No se encontró la columna ticket en la tabla transaction_lines")
    } else {
      console.log("Definición de la columna ticket:")
      console.log(columnResult.rows[0])
    }

    // Verificar si hay secuencias asociadas a la tabla
    const sequenceResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') as sequence_name
    `

    if (sequenceResult.rows[0].sequence_name) {
      console.log(`\nLa columna ticket está asociada a la secuencia: ${sequenceResult.rows[0].sequence_name}`)

      // Obtener el valor actual de la secuencia
      const currentValResult = await sql`
        SELECT last_value, is_called FROM ${sql.raw(sequenceResult.rows[0].sequence_name)}
      `

      console.log("Valor actual de la secuencia:", currentValResult.rows[0])
    } else {
      console.log("\nNo hay secuencia asociada directamente a la columna ticket")
    }

    // Verificar restricciones en la tabla
    const constraintResult = await sql`
      SELECT con.conname as constraint_name, 
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con 
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'transaction_lines'
    `

    if (constraintResult.rows.length === 0) {
      console.log("\nNo se encontraron restricciones en la tabla transaction_lines")
    } else {
      console.log("\nRestricciones en la tabla transaction_lines:")
      constraintResult.rows.forEach((constraint) => {
        console.log(`${constraint.constraint_name}: ${constraint.constraint_definition}`)
      })
    }
  } catch (error) {
    console.error("Error al verificar la definición de la columna:", error)
  }
}

checkTicketColumnDefinition()
