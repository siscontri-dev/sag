import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Consultar algunas líneas recientes para verificar los valores
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

    // Verificar si hay alguna discrepancia entre ticket y ticket2
    const discrepancies = result.rows.filter((row) => row.ticket !== row.ticket2)

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

    return NextResponse.json({
      success: true,
      lines: result.rows,
      discrepancies: discrepancies,
      tableInfo: tableInfo.rows,
      triggers: triggers.rows,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error al verificar tickets: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
