// Este script verifica y corrige la columna ticket en transaction_lines
// Ejecutar con: node fix-ticket-column-safely.js

import { sql } from "@vercel/postgres"

async function fixTicketColumnSafely() {
  try {
    console.log("Verificando el tipo de la columna ticket...")

    // Verificar el tipo de la columna ticket
    const columnTypeResult = await sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      AND column_name = 'ticket'
    `

    if (columnTypeResult.rows.length === 0) {
      console.log("La columna ticket no existe")
      return
    }

    const currentType = columnTypeResult.rows[0].data_type
    console.log(`El tipo actual de la columna ticket es: ${currentType}`)

    // Si el tipo es text, verificar si todos los valores son numéricos
    if (currentType.toLowerCase() === "text") {
      console.log("Verificando si todos los valores de ticket son numéricos...")

      const nonNumericResult = await sql`
        SELECT COUNT(*) as count
        FROM transaction_lines
        WHERE ticket IS NOT NULL
        AND ticket <> ''
        AND ticket !~ E'^\\d+$'
      `

      const nonNumericCount = Number.parseInt(nonNumericResult.rows[0].count, 10)

      if (nonNumericCount > 0) {
        console.log(`Se encontraron ${nonNumericCount} valores no numéricos en la columna ticket`)
        console.log("No se puede convertir la columna a INTEGER de forma segura")

        // Crear la columna ticket2 si no existe
        const ticket2Result = await sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'transaction_lines'
          AND column_name = 'ticket2'
        `

        if (ticket2Result.rows.length === 0) {
          console.log("Creando la columna ticket2...")
          await sql`
            ALTER TABLE transaction_lines
            ADD COLUMN ticket2 INTEGER;
          `
          console.log("Columna ticket2 creada con éxito")
        }

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
      } else {
        console.log("Todos los valores de ticket son numéricos")
        console.log("Se puede convertir la columna a INTEGER de forma segura")

        // Crear una columna temporal para la conversión
        console.log("Creando columna temporal...")
        await sql`
          ALTER TABLE transaction_lines
          ADD COLUMN ticket_temp INTEGER;
        `

        // Convertir los valores de text a integer
        console.log("Convirtiendo valores...")
        await sql`
          UPDATE transaction_lines
          SET ticket_temp = CASE 
            WHEN ticket ~ E'^\\d+$' THEN ticket::INTEGER
            ELSE 0
          END
          WHERE ticket IS NOT NULL;
        `

        // Eliminar la columna original
        console.log("Eliminando columna original...")
        await sql`
          ALTER TABLE transaction_lines
          DROP COLUMN ticket;
        `

        // Renombrar la columna temporal
        console.log("Renombrando columna temporal...")
        await sql`
          ALTER TABLE transaction_lines
          RENAME COLUMN ticket_temp TO ticket;
        `

        console.log("Columna ticket convertida a INTEGER con éxito")
      }
    } else if (currentType.toLowerCase() === "integer") {
      console.log("La columna ticket ya es de tipo INTEGER")
    } else {
      console.log(`La columna ticket es de tipo ${currentType}, no se realizará ninguna acción`)
    }
  } catch (error) {
    console.error("Error al verificar o corregir la columna ticket:", error)
  } finally {
    process.exit(0)
  }
}

fixTicketColumnSafely()
