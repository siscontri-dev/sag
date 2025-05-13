import { sql } from "@vercel/postgres"

async function main() {
  console.log("Iniciando corrección de formatos de fecha en la base de datos...")

  try {
    // 1. Obtener todas las tablas de la base de datos
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    const tables = tablesResult.rows.map((row) => row.table_name)
    console.log(`Encontradas ${tables.length} tablas para procesar.`)

    // 2. Para cada tabla, obtener las columnas que podrían contener fechas
    for (const table of tables) {
      console.log(`\nProcesando tabla: ${table}`)

      const columnsResult = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
        AND (
          data_type LIKE '%timestamp%' 
          OR data_type LIKE '%date%' 
          OR column_name LIKE '%fecha%' 
          OR column_name LIKE '%date%' 
          OR column_name LIKE '%created_at%' 
          OR column_name LIKE '%updated_at%'
        )
      `

      const dateColumns = columnsResult.rows.map((row) => row.column_name)

      if (dateColumns.length === 0) {
        console.log(`  No se encontraron columnas de fecha en la tabla ${table}.`)
        continue
      }

      console.log(`  Encontradas ${dateColumns.length} columnas de fecha: ${dateColumns.join(", ")}`)

      // 3. Para cada columna de fecha, actualizar los registros
      for (const column of dateColumns) {
        console.log(`  Procesando columna: ${column}`)

        // Obtener los registros con fechas
        const recordsResult = await sql`
          SELECT id, ${sql(column)} 
          FROM ${sql(table)} 
          WHERE ${sql(column)} IS NOT NULL
        `

        console.log(`    Encontrados ${recordsResult.rows.length} registros con fechas.`)

        // Actualizar cada registro
        let updatedCount = 0

        for (const record of recordsResult.rows) {
          if (!record.id) {
            console.log(`    Advertencia: Registro sin ID, saltando.`)
            continue
          }

          const originalDate = record[column]

          // Si ya es una cadena en formato DD/MM/YYYY, no hacer nada
          if (typeof originalDate === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(originalDate)) {
            continue
          }

          let formattedDate

          try {
            // Convertir a objeto Date
            const dateObj = new Date(originalDate)

            // Verificar si la fecha es válida
            if (isNaN(dateObj.getTime())) {
              console.log(`    Advertencia: Fecha inválida en ${table}.${column} para ID ${record.id}: ${originalDate}`)
              continue
            }

            // Formatear a DD/MM/YYYY
            const day = String(dateObj.getDate()).padStart(2, "0")
            const month = String(dateObj.getMonth() + 1).padStart(2, "0")
            const year = dateObj.getFullYear()
            formattedDate = `${day}/${month}/${year}`

            // Actualizar el registro
            await sql`
              UPDATE ${sql(table)} 
              SET ${sql(column)} = ${formattedDate} 
              WHERE id = ${record.id}
            `

            updatedCount++
          } catch (error) {
            console.error(`    Error al procesar fecha en ${table}.${column} para ID ${record.id}:`, error)
          }
        }

        console.log(`    Actualizados ${updatedCount} registros en ${table}.${column}.`)
      }
    }

    console.log("\nProceso de corrección de fechas completado con éxito.")
  } catch (error) {
    console.error("Error durante el proceso de corrección de fechas:", error)
  }
}

main().catch(console.error)
