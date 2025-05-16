// Este script intenta corregir el problema de COALESCE con la columna ticket
// Ejecutar con: node fix-coalesce-issue.js

import { sql } from "@vercel/postgres"

async function fixCoalesceIssue() {
  try {
    console.log("Iniciando corrección del problema de COALESCE...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Verificar si hay alguna función que use COALESCE con ticket
    const functionsResult = await sql`
      SELECT routine_name, routine_definition
      FROM information_schema.routines
      WHERE routine_type = 'FUNCTION'
      AND routine_schema = 'public'
      AND routine_definition LIKE '%COALESCE%'
      AND routine_definition LIKE '%ticket%'
    `

    if (functionsResult.rows.length > 0) {
      console.log(`Encontradas ${functionsResult.rows.length} funciones que usan COALESCE con ticket`)

      // Aquí podríamos intentar modificar las funciones, pero es complicado
      // sin conocer su estructura exacta
      console.log("Se recomienda revisar y modificar manualmente estas funciones")
    }

    // 2. Verificar si hay algún trigger que use COALESCE con ticket
    const triggersResult = await sql`
      SELECT trigger_name, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND action_statement LIKE '%COALESCE%'
      AND action_statement LIKE '%ticket%'
    `

    if (triggersResult.rows.length > 0) {
      console.log(`Encontrados ${triggersResult.rows.length} triggers que usan COALESCE con ticket`)

      // Aquí podríamos intentar modificar los triggers, pero es complicado
      // sin conocer su estructura exacta
      console.log("Se recomienda revisar y modificar manualmente estos triggers")
    }

    // 3. Verificar si hay alguna vista que use COALESCE con ticket
    const viewsResult = await sql`
      SELECT table_name, view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND view_definition LIKE '%COALESCE%'
      AND view_definition LIKE '%ticket%'
    `

    if (viewsResult.rows.length > 0) {
      console.log(`Encontradas ${viewsResult.rows.length} vistas que usan COALESCE con ticket`)

      // Aquí podríamos intentar modificar las vistas, pero es complicado
      // sin conocer su estructura exacta
      console.log("Se recomienda revisar y modificar manualmente estas vistas")
    }

    // 4. Asegurarse de que todos los valores de ticket sean de tipo texto
    console.log("Asegurando que todos los valores de ticket sean de tipo texto...")

    await sql`
      UPDATE transaction_lines
      SET ticket = CAST(ticket AS TEXT)
      WHERE ticket IS NOT NULL
    `

    // 5. Asegurarse de que no haya valores NULL en la columna ticket
    console.log("Asegurando que no haya valores NULL en la columna ticket...")

    await sql`
      UPDATE transaction_lines
      SET ticket = ''
      WHERE ticket IS NULL
    `

    // 6. Modificar la columna ticket para que no acepte valores NULL
    console.log("Modificando la columna ticket para que no acepte valores NULL...")

    await sql`
      ALTER TABLE transaction_lines
      ALTER COLUMN ticket SET NOT NULL,
      ALTER COLUMN ticket SET DEFAULT ''
    `

    // Confirmar la transacción
    await sql`COMMIT`

    console.log("Corrección del problema de COALESCE completada")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al corregir el problema de COALESCE:", error)
  } finally {
    process.exit(0)
  }
}

fixCoalesceIssue()
