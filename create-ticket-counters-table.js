import { sql } from "@vercel/postgres"

async function createTicketCountersTable() {
  try {
    console.log("Verificando si existe la tabla ticket_counters...")

    // Verificar si la tabla ya existe
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ticket_counters'
      ) as exists
    `

    if (tableCheck.rows[0].exists) {
      console.log("La tabla ticket_counters ya existe.")
      return
    }

    console.log("Creando tabla ticket_counters...")

    // Crear la tabla
    await sql`
      CREATE TABLE ticket_counters (
        id SERIAL PRIMARY KEY,
        business_location_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        current_count INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL,
        CONSTRAINT unique_location_year_month UNIQUE (business_location_id, year, month)
      )
    `

    console.log("Tabla ticket_counters creada exitosamente.")

    // Crear índices para mejorar el rendimiento
    await sql`
      CREATE INDEX idx_ticket_counters_location_year_month 
      ON ticket_counters (business_location_id, year, month)
    `

    console.log("Índices creados exitosamente.")
  } catch (error) {
    console.error("Error al crear tabla ticket_counters:", error)
  }
}

createTicketCountersTable()
