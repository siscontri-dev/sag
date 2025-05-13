const { sql } = require("@vercel/postgres")

async function fixGuia154() {
  console.log("Iniciando reparación de la guía con ID 154...")

  try {
    // 1. Verificar si la guía existe
    const checkResult = await sql`SELECT id, type, activo FROM transactions WHERE id = 154`

    if (checkResult.rows.length === 0) {
      console.log("La guía con ID 154 no existe en la base de datos.")
      return
    }

    const guia = checkResult.rows[0]
    console.log(`Guía encontrada: ID=${guia.id}, Tipo=${guia.type}, Activo=${guia.activo}`)

    // 2. Activar la guía si está inactiva
    if (!guia.activo) {
      console.log("La guía está inactiva. Activando...")
      await sql`UPDATE transactions SET activo = TRUE WHERE id = 154`
      console.log("Guía activada correctamente.")
    }

    // 3. Verificar las líneas de transacción
    const linesResult = await sql`SELECT COUNT(*) as count FROM transaction_lines WHERE transaction_id = 154`
    const linesCount = linesResult.rows[0].count
    console.log(`La guía tiene ${linesCount} líneas de transacción.`)

    // 4. Verificar referencias a contactos
    const contactsResult = await sql`
      SELECT 
        t.id_dueno_anterior, 
        t.id_dueno_nuevo,
        c1.id as dueno_anterior_exists,
        c2.id as dueno_nuevo_exists
      FROM 
        transactions t
        LEFT JOIN contacts c1 ON t.id_dueno_anterior = c1.id
        LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE 
        t.id = 154
    `

    if (contactsResult.rows.length > 0) {
      const contactInfo = contactsResult.rows[0]
      console.log(
        `ID Dueño Anterior: ${contactInfo.id_dueno_anterior}, Existe: ${contactInfo.dueno_anterior_exists ? "Sí" : "No"}`,
      )
      console.log(
        `ID Dueño Nuevo: ${contactInfo.id_dueno_nuevo}, Existe: ${contactInfo.dueno_nuevo_exists ? "Sí" : "No"}`,
      )

      // 5. Reparar referencias a contactos si es necesario
      if (contactInfo.id_dueno_anterior && !contactInfo.dueno_anterior_exists) {
        console.log(`El dueño anterior con ID ${contactInfo.id_dueno_anterior} no existe. Intentando reparar...`)
        // Buscar un contacto válido para usar como reemplazo
        const validContactResult = await sql`SELECT id FROM contacts WHERE activo = TRUE LIMIT 1`
        if (validContactResult.rows.length > 0) {
          const validContactId = validContactResult.rows[0].id
          await sql`UPDATE transactions SET id_dueno_anterior = ${validContactId} WHERE id = 154`
          console.log(`Referencia al dueño anterior actualizada al contacto con ID ${validContactId}.`)
        }
      }
    }

    console.log("Reparación completada.")
  } catch (error) {
    console.error("Error durante la reparación:", error)
  }
}

fixGuia154()
