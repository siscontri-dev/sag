import { sql } from "@vercel/postgres"

async function checkAndDisableTicketTrigger() {
  try {
    console.log("Verificando triggers en la tabla transaction_lines...")

    // Consultar los triggers existentes en la tabla transaction_lines
    const result = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      ORDER BY trigger_name
    `

    if (result.rows.length === 0) {
      console.log("No se encontraron triggers en la tabla transaction_lines")
    } else {
      console.log(`Se encontraron ${result.rows.length} triggers:`)

      for (const trigger of result.rows) {
        console.log(`\nTrigger: ${trigger.trigger_name}`)
        console.log(`Evento: ${trigger.event_manipulation}`)
        console.log(`Acción: ${trigger.action_statement}`)

        // Verificar si el trigger modifica el campo ticket
        if (trigger.action_statement.includes("ticket") || trigger.action_statement.includes("NEW.ticket")) {
          console.log(`\n¡ATENCIÓN! Este trigger parece modificar el campo ticket.`)

          // Preguntar si se desea deshabilitar el trigger
          console.log(`\nPara deshabilitar este trigger, ejecute la siguiente consulta SQL:`)
          console.log(`ALTER TABLE transaction_lines DISABLE TRIGGER ${trigger.trigger_name};`)

          // Alternativa: crear un nuevo trigger que respete el valor proporcionado
          console.log(
            `\nAlternativamente, puede modificar el trigger para que respete el valor de ticket proporcionado.`,
          )
        }
      }
    }

    // Verificar si hay alguna secuencia asociada al campo ticket
    console.log("\nVerificando secuencias asociadas al campo ticket...")
    const sequencesResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') as sequence_name
    `

    if (sequencesResult.rows[0].sequence_name) {
      console.log(`\n¡ATENCIÓN! El campo ticket está asociado a la secuencia: ${sequencesResult.rows[0].sequence_name}`)
      console.log(`Esto puede causar que los valores proporcionados sean sobrescritos.`)

      // Sugerir cómo modificar la columna para eliminar la secuencia
      console.log(`\nPara eliminar la asociación con la secuencia, ejecute:`)
      console.log(`ALTER TABLE transaction_lines ALTER COLUMN ticket DROP DEFAULT;`)
    } else {
      console.log("No se encontró ninguna secuencia asociada al campo ticket.")
    }

    // Verificar la definición de la columna ticket
    console.log("\nVerificando la definición de la columna ticket...")
    const columnDefResult = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    if (columnDefResult.rows.length > 0) {
      const columnDef = columnDefResult.rows[0]
      console.log(`Nombre: ${columnDef.column_name}`)
      console.log(`Tipo de datos: ${columnDef.data_type}`)
      console.log(`Valor por defecto: ${columnDef.column_default || "ninguno"}`)
      console.log(`Permite NULL: ${columnDef.is_nullable}`)

      if (columnDef.column_default && columnDef.column_default.includes("nextval")) {
        console.log(`\n¡ATENCIÓN! La columna ticket tiene un valor por defecto que utiliza una secuencia.`)
        console.log(`Esto puede causar que los valores proporcionados sean sobrescritos.`)
      }
    } else {
      console.log("No se pudo obtener información sobre la columna ticket.")
    }
  } catch (error) {
    console.error("Error al verificar triggers:", error)
  }
}

checkAndDisableTicketTrigger()
