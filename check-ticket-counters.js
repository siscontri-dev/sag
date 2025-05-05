import { sql } from "@vercel/postgres"

async function checkTicketCountersTable() {
  try {
    console.log("Verificando tabla ticket_counters...")

    // Verificar si la tabla existe
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ticket_counters'
      ) as exists
    `

    if (!tableCheck.rows[0].exists) {
      console.log("La tabla ticket_counters NO existe.")
      return
    }

    console.log("La tabla ticket_counters existe. Verificando estructura...")

    // Verificar columnas
    const columnsResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ticket_counters'
      ORDER BY ordinal_position
    `

    console.log("Columnas encontradas:")
    columnsResult.rows.forEach((col) => {
      console.log(`- ${col.column_name} (${col.data_type})`)
    })

    // Verificar restricciones
    const constraintsResult = await sql`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
      AND conrelid = 'ticket_counters'::regclass
    `

    console.log("\nRestricciones encontradas:")
    constraintsResult.rows.forEach((con) => {
      console.log(`- ${con.conname}: ${con.def}`)
    })

    // Verificar datos existentes
    const dataResult = await sql`
      SELECT * FROM ticket_counters
    `

    console.log("\nDatos existentes:")
    console.log(dataResult.rows)
  } catch (error) {
    console.error("Error al verificar tabla ticket_counters:", error)
  }
}

checkTicketCountersTable()
