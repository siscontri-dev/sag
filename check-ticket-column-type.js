import { sql } from "@vercel/postgres"

async function checkTicketColumnType() {
  try {
    console.log("Verificando tipo de columna ticket en transaction_lines...")

    // Verificar si la tabla transaction_lines existe
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'transaction_lines'
    `

    if (tableCheck.rows.length === 0) {
      console.log("La tabla transaction_lines no existe.")
      return
    }

    // Verificar el tipo de la columna ticket
    const ticketCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' 
      AND column_name = 'ticket'
    `

    if (ticketCheck.rows.length === 0) {
      console.log("La columna ticket no existe en la tabla transaction_lines.")
    } else {
      console.log(`La columna ticket es de tipo: ${ticketCheck.rows[0].data_type}`)
    }

    // Verificar si existe la columna ticket2
    const ticket2Check = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' 
      AND column_name = 'ticket2'
    `

    if (ticket2Check.rows.length === 0) {
      console.log("La columna ticket2 no existe en la tabla transaction_lines.")
    } else {
      console.log(`La columna ticket2 es de tipo: ${ticket2Check.rows[0].data_type}`)
    }

    // Verificar si hay triggers en la tabla
    const triggerCheck = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
    `

    if (triggerCheck.rows.length === 0) {
      console.log("No hay triggers en la tabla transaction_lines.")
    } else {
      console.log(`Se encontraron ${triggerCheck.rows.length} triggers en la tabla transaction_lines:`)
      triggerCheck.rows.forEach((trigger, index) => {
        console.log(`${index + 1}. ${trigger.trigger_name} (${trigger.event_manipulation})`)
        console.log(`   Acción: ${trigger.action_statement}`)
      })
    }
  } catch (error) {
    console.error("Error al verificar la columna ticket:", error)
  }
}

checkTicketColumnType()
