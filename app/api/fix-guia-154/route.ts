import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    console.log("Iniciando reparación de la guía con ID 154...")

    // 1. Verificar si la guía existe
    const checkResult = await sql`SELECT id, type, activo FROM transactions WHERE id = 154`

    if (checkResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "La guía con ID 154 no existe en la base de datos.",
      })
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

    // 6. Obtener la guía completa después de las reparaciones
    const transactionResult = await sql`
      SELECT t.*, 
             c1.primer_nombre || ' ' || c1.primer_apellido as dueno_anterior_nombre,
             c1.nit as dueno_anterior_nit,
             c2.primer_nombre || ' ' || c2.primer_apellido as dueno_nuevo_nombre,
             c2.nit as dueno_nuevo_nit
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno_anterior = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE t.id = 154
    `

    // 7. Obtener las líneas de transacción
    const linesDetailResult = await sql`
      SELECT tl.*, 
             p.name as product_name,
             r.name as raza_nombre,
             c.name as color_nombre
      FROM transaction_lines tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors c ON tl.color_id = c.id
      WHERE tl.transaction_id = 154
      ORDER BY tl.id
    `

    return NextResponse.json({
      success: true,
      message: "Reparación completada.",
      guia: transactionResult.rows[0],
      lineas: linesDetailResult.rows,
      diagnostico: {
        existeGuia: checkResult.rows.length > 0,
        guiaActiva: guia.activo,
        tipoGuia: guia.type,
        cantidadLineas: linesCount,
        contactosValidos:
          contactsResult.rows.length > 0 ? (contactsResult.rows[0].dueno_anterior_exists ? "Sí" : "No") : "Desconocido",
      },
    })
  } catch (error) {
    console.error("Error durante la reparación:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error durante la reparación",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
