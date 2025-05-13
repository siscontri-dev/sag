import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Verificar si la guía existe en la tabla transactions
    const transactionResult = await sql`
      SELECT 
        id, 
        type, 
        activo, 
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        business_location_id
      FROM transactions 
      WHERE id = ${id}
    `

    if (transactionResult.rows.length === 0) {
      return NextResponse.json({ exists: false, message: "La guía no existe en la base de datos" })
    }

    const transaction = transactionResult.rows[0]

    // Verificar si tiene líneas asociadas
    const linesResult = await sql`
      SELECT COUNT(*) as count FROM transaction_lines WHERE transaction_id = ${id}
    `

    const linesCount = Number.parseInt(linesResult.rows[0].count)

    // Verificar si los contactos asociados existen
    let ownerExists = null
    let newOwnerExists = null

    if (transaction.id_dueno_anterior) {
      const ownerResult = await sql`
        SELECT id, primer_nombre, primer_apellido, activo 
        FROM contacts 
        WHERE id = ${transaction.id_dueno_anterior}
      `
      ownerExists = ownerResult.rows.length > 0 ? ownerResult.rows[0] : null
    }

    if (transaction.id_dueno_nuevo) {
      const newOwnerResult = await sql`
        SELECT id, primer_nombre, primer_apellido, activo 
        FROM contacts 
        WHERE id = ${transaction.id_dueno_nuevo}
      `
      newOwnerExists = newOwnerResult.rows.length > 0 ? newOwnerResult.rows[0] : null
    }

    return NextResponse.json({
      exists: true,
      transaction,
      linesCount,
      ownerExists,
      newOwnerExists,
      message: transaction.activo ? "La guía existe y está activa" : "La guía existe pero está inactiva",
    })
  } catch (error) {
    console.error(`Error al verificar guía ID ${params.id}:`, error)
    return NextResponse.json(
      {
        exists: false,
        error: true,
        message: "Error al verificar la guía",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
