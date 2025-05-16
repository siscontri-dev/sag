// Este script busca y muestra los triggers específicos en la tabla transaction_lines
// Ejecutar con: node check-transaction-lines-triggers.js

import { sql } from "@vercel/postgres"

async function checkTransactionLinesTriggers() {
  try {
    console.log("Buscando triggers en la tabla transaction_lines...")

    // Obtener todos los triggers de la tabla transaction_lines
    const triggersResult = await sql`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines'
      AND event_object_schema = 'public'
    `

    if (triggersResult.rows.length === 0) {
      console.log("No se encontraron triggers en la tabla transaction_lines")
    } else {
      console.log(`Se encontraron ${triggersResult.rows.length} triggers:`)

      for (const trigger of triggersResult.rows) {
        console.log(`\nNombre: ${trigger.trigger_name}`)
        console.log(`Evento: ${trigger.event_manipulation}`)
        console.log(`Timing: ${trigger.action_timing}`)
        console.log(`Definición: ${trigger.action_statement}`)

        // Verificar si el trigger usa COALESCE con ticket
        if (
          trigger.action_statement &&
          trigger.action_statement.includes("COALESCE") &&
          trigger.action_statement.includes("ticket")
        ) {
          console.log("⚠️ ESTE TRIGGER USA COALESCE CON LA COLUMNA TICKET ⚠️")
        }
      }
    }

    // Obtener la definición de la función que podría estar usando el trigger
    console.log("\nBuscando funciones relacionadas con transaction_lines...")

    const functionsResult = await sql`
      SELECT 
        routine_name, 
        routine_definition
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
      AND routine_schema = 'public'
      AND routine_definition LIKE '%transaction_lines%'
    `

    if (functionsResult.rows.length === 0) {
      console.log("No se encontraron funciones relacionadas con transaction_lines")
    } else {
      console.log(`Se encontraron ${functionsResult.rows.length} funciones:`)

      for (const func of functionsResult.rows) {
        console.log(`\nNombre: ${func.routine_name}`)
        console.log(`Definición: ${func.routine_definition}`)

        // Verificar si la función usa COALESCE con ticket
        if (
          func.routine_definition &&
          func.routine_definition.includes("COALESCE") &&
          func.routine_definition.includes("ticket")
        ) {
          console.log("⚠️ ESTA FUNCIÓN USA COALESCE CON LA COLUMNA TICKET ⚠️")
        }
      }
    }

    console.log("\nBúsqueda completada")
  } catch (error) {
    console.error("Error al buscar triggers:", error)
  } finally {
    process.exit(0)
  }
}

checkTransactionLinesTriggers()
