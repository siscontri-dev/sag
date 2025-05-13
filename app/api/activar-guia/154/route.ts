import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function POST() {
  try {
    console.log("Activando guía 154...")

    // Verificar si la guía existe
    const checkResult = await sql`SELECT id, activo FROM transactions WHERE id = 154`

    if (checkResult.rows.length === 0) {
      console.log("Guía 154 no existe, intentando crearla...")

      // Intentar crear una guía básica si no existe
      try {
        // Obtener un contacto válido para usar como referencia
        const contactResult = await sql`SELECT id FROM contacts WHERE activo = TRUE LIMIT 1`

        if (contactResult.rows.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "No hay contactos activos para crear la guía",
            },
            { status: 400 },
          )
        }

        const contactId = contactResult.rows[0].id

        // Crear una guía básica
        await sql`
          INSERT INTO transactions (
            id, business_location_id, type, status, payment_status, 
            id_dueno_anterior, id_dueno_nuevo, activo, created_at, updated_at
          ) VALUES (
            154, 1, 'entry', 'final', 'paid',
            ${contactId}, ${contactId}, TRUE, NOW(), NOW()
          )
          ON CONFLICT (id) DO NOTHING
        `

        return NextResponse.json({
          success: true,
          message: "Guía 154 creada correctamente",
        })
      } catch (createError) {
        console.error("Error al crear guía 154:", createError)
        return NextResponse.json(
          {
            success: false,
            error: createError instanceof Error ? createError.message : "Error al crear la guía",
          },
          { status: 500 },
        )
      }
    }

    // Si la guía existe pero está inactiva, activarla
    if (!checkResult.rows[0].activo) {
      console.log("Guía 154 existe pero está inactiva, activándola...")
      await sql`UPDATE transactions SET activo = TRUE WHERE id = 154`
    } else {
      console.log("Guía 154 ya está activa")
    }

    return NextResponse.json({
      success: true,
      message: "Guía 154 activada correctamente",
    })
  } catch (error) {
    console.error("Error al activar guía 154:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
