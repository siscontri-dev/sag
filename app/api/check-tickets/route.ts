import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verificar la estructura de la tabla
    const tableStructureResult = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transaction_lines'
      ORDER BY ordinal_position;
    `

    // Verificar triggers existentes
    const triggersResult = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'transaction_lines';
    `

    // Verificar restricciones
    const constraintsResult = await sql`
      SELECT con.conname as constraint_name, 
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'transaction_lines'
      AND nsp.nspname = 'public';
    `

    // Verificar secuencias asociadas
    const sequencesResult = await sql`
      SELECT pg_get_serial_sequence('transaction_lines', 'ticket') AS ticket_sequence,
             pg_get_serial_sequence('transaction_lines', 'ticket2') AS ticket2_sequence;
    `

    // Verificar valores actuales (muestra algunos ejemplos)
    const valuesResult = await sql`
      SELECT id, transaction_id, ticket, ticket2
      FROM transaction_lines
      ORDER BY id DESC
      LIMIT 10;
    `

    // Verificar discrepancias entre ticket y ticket2
    const discrepanciesResult = await sql`
      SELECT COUNT(*) as count
      FROM transaction_lines
      WHERE ticket != ticket2;
    `

    return NextResponse.json({
      success: true,
      message: "Información de la tabla transaction_lines",
      data: {
        estructura_tabla: tableStructureResult.rows,
        triggers: triggersResult.rows,
        restricciones: constraintsResult.rows,
        secuencias: sequencesResult.rows,
        valores_ejemplo: valuesResult.rows,
        discrepancias: discrepanciesResult.rows[0].count,
      },
    })
  } catch (error) {
    console.error("Error al verificar la tabla:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al verificar la tabla: ${error.message}`,
        error: error.stack,
      },
      { status: 500 },
    )
  }
}
