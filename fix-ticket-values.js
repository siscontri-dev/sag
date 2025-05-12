import { sql } from "@vercel/postgres"

async function fixTicketValues() {
  try {
    console.log("Iniciando corrección de valores de ticket en la base de datos...")

    // Iniciar una transacción
    await sql`BEGIN`

    // 1. Actualizar ticket2 para que sea igual a ticket en todas las filas
    const updateResult = await sql`
      UPDATE transaction_lines
      SET ticket2 = ticket
      WHERE ticket2 != ticket OR ticket2 IS NULL
      RETURNING id, ticket, ticket2
    `

    console.log(`\n✅ Se actualizaron ${updateResult.rows.length} filas para que ticket2 = ticket:`)
    for (const row of updateResult.rows) {
      console.log(`ID: ${row.id}, Ticket: ${row.ticket}, Ticket2: ${row.ticket2}`)
    }

    // 2. Confirmar la transacción
    await sql`COMMIT`

    console.log("\n✅ Proceso completado. Los valores de ticket2 ahora son iguales a los valores de ticket.")
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("❌ Error al corregir valores de ticket:", error)
  }
}

// Ejecutar la función
fixTicketValues()
