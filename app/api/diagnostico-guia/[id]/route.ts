import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log(`Iniciando diagnóstico para la guía con ID ${id}...`)

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
        diagnostico: {
          existeGuia: false,
        },
      })
    }

    const guia = checkResult.rows[0]

    // Verificar las líneas de transacción
    const linesResult = await sql`
      SELECT COUNT(*) as count 
      FROM transaction_lines 
      WHERE transaction_id = ${id}
    `

    const linesCount = linesResult.rows[0].count

    // Verificar referencias a contactos
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

    let contactInfo = null
    if (contactsResult.rows.length > 0) {
      contactInfo = contactsResult.rows[0]
    }

    // Obtener información detallada de la guía
    const detalleGuia = await sql`
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
      message: "Diagnóstico completado.",
      guia: detalleGuia.rows[0],
      diagnostico: {
        existeGuia: true,
        guiaActiva: guia.activo,
        tipoGuia: guia.type,
        businessLocationId: guia.business_location_id,
        cantidadLineas: linesCount,
        idDuenoAnterior: guia.id_dueno_anterior,
        idDuenoNuevo: guia.id_dueno_nuevo,
        duenoAnteriorExiste: contactInfo ? (contactInfo.dueno_anterior_exists ? true : false) : null,
        duenoNuevoExiste: contactInfo ? (contactInfo.dueno_nuevo_exists ? true : false) : null,
      },
    })
  } catch (error) {
    console.error("Error durante el diagnóstico:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error durante el diagnóstico",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
