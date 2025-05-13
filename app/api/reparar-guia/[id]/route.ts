import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Iniciando reparación para la guía con ID ${id}...`)

    // Verificar si la guía existe
    const checkResult = await sql`
      SELECT id, type, activo, business_location_id, id_dueno_anterior, id_dueno_nuevo 
      FROM transactions 
      WHERE id = ${id}
    `

    if (checkResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: `La guía con ID ${id} no existe en la base de datos.`,
        acciones: [],
      })
    }

    const guia = checkResult.rows[0]
    const acciones = []

    // 1. Activar la guía si está inactiva
    if (!guia.activo) {
      await sql`UPDATE transactions SET activo = TRUE WHERE id = ${id}`
      acciones.push("Guía activada")
    }

    // 2. Verificar y reparar referencias a contactos
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
        t.id = ${id}
    `

    if (contactsResult.rows.length > 0) {
      const contactInfo = contactsResult.rows[0]

      // Reparar dueño anterior si es necesario
      if (contactInfo.id_dueno_anterior && !contactInfo.dueno_anterior_exists) {
        const validContactResult = await sql`SELECT id FROM contacts WHERE activo = TRUE LIMIT 1`
        if (validContactResult.rows.length > 0) {
          const validContactId = validContactResult.rows[0].id
          await sql`UPDATE transactions SET id_dueno_anterior = ${validContactId} WHERE id = ${id}`
          acciones.push(`Referencia al dueño anterior reparada (ID: ${validContactId})`)
        }
      }

      // Reparar dueño nuevo si es necesario
      if (contactInfo.id_dueno_nuevo && !contactInfo.dueno_nuevo_exists) {
        const validContactResult = await sql`SELECT id FROM contacts WHERE activo = TRUE LIMIT 1`
        if (validContactResult.rows.length > 0) {
          const validContactId = validContactResult.rows[0].id
          await sql`UPDATE transactions SET id_dueno_nuevo = ${validContactId} WHERE id = ${id}`
          acciones.push(`Referencia al dueño nuevo reparada (ID: ${validContactId})`)
        }
      }
    }

    // 3. Verificar líneas de transacción
    const linesResult = await sql`SELECT COUNT(*) as count FROM transaction_lines WHERE transaction_id = ${id}`
    const linesCount = linesResult.rows[0].count

    if (linesCount === 0) {
      acciones.push("Advertencia: La guía no tiene líneas de transacción")
    }

    // 4. Obtener la guía actualizada después de las reparaciones
    const updatedGuia = await sql`
      SELECT t.*, 
             c1.primer_nombre || ' ' || c1.primer_apellido as dueno_anterior_nombre,
             c1.nit as dueno_anterior_nit,
             c2.primer_nombre || ' ' || c2.primer_apellido as dueno_nuevo_nombre,
             c2.nit as dueno_nuevo_nit
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno_anterior = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE t.id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: acciones.length > 0 ? "Reparación completada con éxito." : "La guía no necesitaba reparación.",
      acciones: acciones,
      guia: updatedGuia.rows[0],
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
