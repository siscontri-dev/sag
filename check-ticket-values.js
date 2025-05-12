import { sql } from "@vercel/postgres"

async function checkTicketValues() {
  try {
    console.log("Verificando valores de ticket en la base de datos...")

    // Consultar algunas líneas recientes para verificar los valores de ticket y ticket2
    const result = await sql`
      SELECT 
        tl.id, 
        tl.transaction_id, 
        tl.ticket, 
        tl.ticket2, 
        tl.product_id,
        t.numero_documento,
        t.fecha_documento
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      ORDER BY tl.id DESC
      LIMIT 20
    `

    console.log(`\nÚltimas ${result.rows.length} líneas de transacción:`)
    console.log("ID | Trans ID | Ticket | Ticket2 | Producto | Guía | Fecha")
    console.log("-".repeat(80))

    for (const row of result.rows) {
      console.log(
        `${row.id} | ${row.transaction_id} | ${row.ticket} | ${row.ticket2} | ${row.product_id} | ${row.numero_documento} | ${row.fecha_documento}`,
      )
    }

    // Verificar si hay alguna discrepancia entre ticket y ticket2
    const discrepancies = result.rows.filter((row) => row.ticket !== row.ticket2)

    if (discrepancies.length > 0) {
      console.log("\n⚠️ Se encontraron discrepancias entre ticket y ticket2:")
      for (const row of discrepancies) {
        console.log(`ID: ${row.id}, Ticket: ${row.ticket}, Ticket2: ${row.ticket2}`)
      }
    } else {
      console.log("\n✅ No se encontraron discrepancias entre ticket y ticket2 en las últimas líneas.")
    }

    // Verificar la estructura actual de la tabla
    const tableInfo = await sql`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'transaction_lines' AND 
        column_name IN ('ticket', 'ticket2')
      ORDER BY 
        column_name
    `

    console.log("\nEstructura actual de las columnas ticket y ticket2:")
    for (const col of tableInfo.rows) {
      console.log(`${col.column_name}:`)
      console.log(`  Tipo: ${col.data_type}`)
      console.log(`  Valor por defecto: ${col.column_default || "NULL"}`)
      console.log(`  Nullable: ${col.is_nullable}`)
    }

    // Verificar triggers activos
    const triggers = await sql`
      SELECT 
        trigger_name, 
        event_manipulation, 
        action_statement
      FROM 
        information_schema.triggers
      WHERE 
        event_object_table = 'transaction_lines'
      ORDER BY 
        trigger_name
    `

    console.log("\nTriggers activos en la tabla transaction_lines:")
    if (triggers.rows.length === 0) {
      console.log("No hay triggers activos.")
    } else {
      for (const trig of triggers.rows) {
        console.log(`${trig.trigger_name}:`)
        console.log(`  Evento: ${trig.event_manipulation}`)
        console.log(`  Acción: ${trig.action_statement}`)
      }
    }
  } catch (error) {
    console.error("❌ Error al verificar valores de ticket:", error)
  }
}

// Ejecutar la función
checkTicketValues()
