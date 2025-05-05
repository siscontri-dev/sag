import { sql } from "@vercel/postgres"

async function verifyManualResetColumn() {
  try {
    console.log("Verificando columna manual_reset en la tabla ticket_counters...")

    // Verificar si la columna existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'ticket_counters' 
      AND column_name = 'manual_reset'
    `

    if (checkColumn.rows.length > 0) {
      console.log("✅ La columna manual_reset existe en la tabla ticket_counters")

      // Verificar algunos valores
      const checkValues = await sql`
        SELECT location_id, current_ticket, manual_reset
        FROM ticket_counters
        LIMIT 5
      `

      console.log("Valores actuales en la tabla:")
      checkValues.rows.forEach((row) => {
        console.log(
          `Location ID: ${row.location_id}, Current Ticket: ${row.current_ticket}, Manual Reset: ${row.manual_reset}`,
        )
      })
    } else {
      console.log("❌ La columna manual_reset NO existe en la tabla ticket_counters")

      // Intentar añadir la columna
      console.log("Intentando añadir la columna manual_reset...")
      await sql`
        ALTER TABLE ticket_counters
        ADD COLUMN manual_reset BOOLEAN DEFAULT FALSE
      `
      console.log("✅ Columna manual_reset añadida correctamente")
    }
  } catch (error) {
    console.error("Error al verificar columna manual_reset:", error)
  }
}

verifyManualResetColumn()
