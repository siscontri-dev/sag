// Este script verifica y corrige la columna ticket en la tabla transaction_lines
// Ejecutar con: node fix-ticket-column.js

import { sql } from "@vercel/postgres"

async function fixTicketColumn() {
  try {
    console.log("Iniciando verificación y corrección de la columna ticket...")

    // Verificar el tipo de la columna ticket
    const columnTypeResult = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transaction_lines' AND column_name = 'ticket'
    `

    const currentType = columnTypeResult.rows[0]?.data_type
    console.log(`Tipo actual de la columna ticket: ${currentType}`)

    // Si la columna es de tipo text, verificar si hay valores nulos
    if (currentType === "text") {
      console.log("Verificando valores nulos en la columna ticket...")

      const nullTicketsResult = await sql`
        SELECT COUNT(*) as count 
        FROM transaction_lines 
        WHERE ticket IS NULL
      `

      const nullCount = Number.parseInt(nullTicketsResult.rows[0].count)
      console.log(`Encontrados ${nullCount} registros con ticket NULL`)

      if (nullCount > 0) {
        console.log("Actualizando valores NULL a cadena vacía...")
        await sql`
          UPDATE transaction_lines 
          SET ticket = '' 
          WHERE ticket IS NULL
        `
        console.log("Valores NULL actualizados a cadena vacía")
      }
    }

    // Verificar si hay funciones o triggers que usen COALESCE con la columna ticket
    console.log("Verificando triggers en la tabla transaction_lines...")

    const triggersResult = await sql`
      SELECT trigger_name, action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'transaction_lines'
    `

    console.log(`Encontrados ${triggersResult.rows.length} triggers en la tabla transaction_lines`)

    for (const trigger of triggersResult.rows) {
      console.log(`Trigger: ${trigger.trigger_name}`)
      console.log(`Acción: ${trigger.action_statement}`)

      // Si el trigger usa COALESCE con la columna ticket, podríamos necesitar modificarlo
      if (trigger.action_statement.includes("COALESCE") && trigger.action_statement.includes("ticket")) {
        console.log("⚠️ Este trigger usa COALESCE con la columna ticket y podría necesitar ser modificado")
      }
    }

    console.log("Verificación y corrección completadas")
  } catch (error) {
    console.error("Error al verificar/corregir la columna ticket:", error)
  } finally {
    process.exit(0)
  }
}

fixTicketColumn()
