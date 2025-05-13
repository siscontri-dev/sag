// Este script corrige los formatos de fecha en la base de datos
// Ejecutar con: node fix-date-formats.js

import { pool } from "./lib/db.js"
import { forceDateDMY } from "./lib/date-utils.js"

async function fixDateFormats() {
  const client = await pool.connect()

  try {
    console.log("Iniciando corrección de formatos de fecha...")

    // Obtener todas las tablas de la base de datos
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)

    const tables = tablesResult.rows.map((row) => row.table_name)
    console.log(`Encontradas ${tables.length} tablas para revisar`)

    for (const table of tables) {
      // Obtener todas las columnas de tipo fecha para esta tabla
      const columnsResult = await client.query(
        `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND (data_type LIKE '%date%' OR column_name LIKE '%fecha%' OR column_name LIKE '%date%')
      `,
        [table],
      )

      const dateColumns = columnsResult.rows.map((row) => row.column_name)

      if (dateColumns.length > 0) {
        console.log(`Tabla ${table} tiene ${dateColumns.length} columnas de fecha: ${dateColumns.join(", ")}`)

        // Actualizar cada columna de fecha
        for (const column of dateColumns) {
          // Verificar si hay registros con fechas en esta columna
          const checkResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM "${table}" 
            WHERE "${column}" IS NOT NULL
          `)

          const count = Number.parseInt(checkResult.rows[0].count)

          if (count > 0) {
            console.log(`Procesando ${count} registros en ${table}.${column}`)

            // Obtener todos los registros con fechas
            const recordsResult = await client.query(`
              SELECT id, "${column}" 
              FROM "${table}" 
              WHERE "${column}" IS NOT NULL
            `)

            // Actualizar cada registro
            for (const record of recordsResult.rows) {
              const originalDate = record[column]
              const formattedDate = forceDateDMY(originalDate)

              // Solo actualizar si el formato cambió
              if (originalDate !== formattedDate) {
                await client.query(
                  `
                  UPDATE "${table}" 
                  SET "${column}" = $1 
                  WHERE id = $2
                `,
                  [formattedDate, record.id],
                )

                console.log(`Actualizado ${table}.${column} para id=${record.id}: ${originalDate} -> ${formattedDate}`)
              }
            }
          }
        }
      }
    }

    console.log("Corrección de formatos de fecha completada")
  } catch (error) {
    console.error("Error al corregir formatos de fecha:", error)
  } finally {
    client.release()
  }
}

fixDateFormats().catch(console.error)
