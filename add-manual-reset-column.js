import { sql } from "@vercel/postgres"

async function addManualResetColumn() {
  try {
    console.log("Añadiendo columna manual_reset a la tabla ticket_counters...")

    // Verificar si la columna ya existe
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ticket_counters' 
      AND column_name = 'manual_reset'
    `

    if (checkColumn.rowCount === 0) {
      // La columna no existe, añadirla
      await sql`
        ALTER TABLE ticket_counters 
        ADD COLUMN manual_reset BOOLEAN DEFAULT FALSE
      `
      console.log("Columna manual_reset añadida correctamente")
    } else {
      console.log("La columna manual_reset ya existe")
    }

    console.log("Proceso completado")
  } catch (error) {
    console.error("Error al añadir columna manual_reset:", error)
  }
}

addManualResetColumn()
