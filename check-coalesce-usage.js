// Este script busca y muestra todas las funciones, vistas y triggers
// que utilizan COALESCE con la columna ticket
// Ejecutar con: node check-coalesce-usage.js

import { sql } from "@vercel/postgres"

async function checkCoalesceUsage() {
  try {
    console.log("Buscando usos de COALESCE con la columna ticket...")

    // 1. Buscar en funciones
    console.log("\nBuscando en funciones...")
    const functionsResult = await sql`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
      AND routine_schema = 'public'
    `

    let foundInFunctions = false
    for (const func of functionsResult.rows) {
      if (
        func.routine_definition &&
        func.routine_definition.includes("COALESCE") &&
        func.routine_definition.includes("ticket")
      ) {
        console.log(`Función: ${func.routine_name}`)
        console.log(`Definición: ${func.routine_definition.substring(0, 200)}...`)
        foundInFunctions = true
      }
    }

    if (!foundInFunctions) {
      console.log("No se encontraron funciones que usen COALESCE con la columna ticket")
    }

    // 2. Buscar en vistas
    console.log("\nBuscando en vistas...")
    const viewsResult = await sql`
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
    `

    let foundInViews = false
    for (const view of viewsResult.rows) {
      if (
        view.view_definition &&
        view.view_definition.includes("COALESCE") &&
        view.view_definition.includes("ticket")
      ) {
        console.log(`Vista: ${view.table_name}`)
        console.log(`Definición: ${view.view_definition.substring(0, 200)}...`)
        foundInViews = true
      }
    }

    if (!foundInViews) {
      console.log("No se encontraron vistas que usen COALESCE con la columna ticket")
    }

    // 3. Buscar en triggers
    console.log("\nBuscando en triggers...")
    const triggersResult = await sql`
      SELECT trigger_name, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
    `

    let foundInTriggers = false
    for (const trigger of triggersResult.rows) {
      if (
        trigger.action_statement &&
        trigger.action_statement.includes("COALESCE") &&
        trigger.action_statement.includes("ticket")
      ) {
        console.log(`Trigger: ${trigger.trigger_name}`)
        console.log(`Acción: ${trigger.action_statement.substring(0, 200)}...`)
        foundInTriggers = true
      }
    }

    if (!foundInTriggers) {
      console.log("No se encontraron triggers que usen COALESCE con la columna ticket")
    }

    // 4. Buscar en índices
    console.log("\nBuscando en índices...")
    const indexesResult = await sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
    `

    let foundInIndexes = false
    for (const index of indexesResult.rows) {
      if (index.indexdef && index.indexdef.includes("COALESCE") && index.indexdef.includes("ticket")) {
        console.log(`Índice: ${index.indexname}`)
        console.log(`Definición: ${index.indexdef}`)
        foundInIndexes = true
      }
    }

    if (!foundInIndexes) {
      console.log("No se encontraron índices que usen COALESCE con la columna ticket")
    }

    console.log("\nBúsqueda completada")
  } catch (error) {
    console.error("Error al buscar usos de COALESCE:", error)
  } finally {
    process.exit(0)
  }
}

checkCoalesceUsage()
