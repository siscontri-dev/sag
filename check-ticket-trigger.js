import { sql } from "@vercel/postgres"

async function checkTicketTrigger() {
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
      result.rows.forEach((trigger, index) => {
        console.log(`\nTrigger ${index + 1}: ${trigger.trigger_name}`)
        console.log(`Evento: ${trigger.event_manipulation}`)
        console.log(`Acción: ${trigger.action_statement}`)
      })
    }

    // Verificar si hay alguna función que pueda estar modificando el campo ticket
    console.log("\nVerificando funciones que podrían modificar el campo ticket...")
    const functionsResult = await sql`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE prosrc LIKE '%ticket%'
      AND proname NOT LIKE 'pg_%'
    `

    if (functionsResult.rows.length === 0) {
      console.log("No se encontraron funciones que modifiquen el campo ticket")
    } else {
      console.log(`Se encontraron ${functionsResult.rows.length} funciones:`)
      functionsResult.rows.forEach((func, index) => {
        console.log(`\nFunción ${index + 1}: ${func.proname}`)
        console.log(`Código: ${func.prosrc.substring(0, 200)}...`)
      })
    }
  } catch (error) {
    console.error("Error al verificar triggers:", error)
  }
}

checkTicketTrigger()
