import { sql } from "@vercel/postgres"

async function ensureManualResetColumn() {
  try {
    console.log("Verificando si la columna manual_reset existe...")

    // Verificar si la columna ya existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ticket_counters' 
      AND column_name = 'manual_reset'
    `

    if (checkColumn.rows.length === 0) {
      console.log("La columna manual_reset no existe, añadiéndola...")

      try {
        await sql`
          ALTER TABLE ticket_counters 
          ADD COLUMN manual_reset BOOLEAN DEFAULT FALSE
        `
        console.log("✅ Columna manual_reset añadida correctamente")
      } catch (alterError) {
        console.error("Error al añadir la columna manual_reset:", alterError)

        // Verificar si la tabla existe
        const checkTable = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'ticket_counters'
        `

        if (checkTable.rows.length === 0) {
          console.error("❌ La tabla ticket_counters no existe")
        } else {
          console.log("La tabla ticket_counters existe, pero no se pudo añadir la columna")
        }
      }
    } else {
      console.log("✅ La columna manual_reset ya existe")
    }

    // Mostrar la estructura actual de la tabla
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ticket_counters' 
      ORDER BY ordinal_position
    `

    console.log("Estructura actual de la tabla ticket_counters:")
    columns.rows.forEach((col) => {
      console.log(`- ${col.column_name} (${col.data_type})`)
    })

    // Mostrar algunos datos de la tabla
    const data = await sql`
      SELECT * FROM ticket_counters LIMIT 5
    `

    console.log("\nDatos actuales en la tabla ticket_counters:")
    if (data.rows.length === 0) {
      console.log("No hay datos en la tabla")
    } else {
      data.rows.forEach((row) => {
        console.log(row)
      })
    }
  } catch (error) {
    console.error("Error al verificar/añadir la columna manual_reset:", error)
  }
}

ensureManualResetColumn()
