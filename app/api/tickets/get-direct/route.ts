import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    let query = `
      SELECT 
        tl.id,
        tl.transaction_id,
        tl.ticket,
        tl.ticket2,
        tl.quantity,
        tl.unit_price,
        tl.unit_price_inc_tax,
        tl.item_tax,
        tl.tax_id,
        tl.lot_no_line_id,
        tl.parent_line_id,
        tl.peso,
        tl.genero,
        tl.color,
        tl.raza,
        tl.marca,
        tl.edad,
        tl.created_at,
        tl.updated_at,
        t.invoice_no,
        t.ref_no,
        t.transaction_date as fecha,
        t.business_location_id,
        t.contact_id,
        t.final_total as valor
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE 1=1
    `

    const params = []

    if (locationId) {
      query += ` AND t.business_location_id = $${params.length + 1}`
      params.push(locationId)
    }

    if (fechaDesde) {
      query += ` AND t.transaction_date >= $${params.length + 1}`
      params.push(fechaDesde)
    }

    if (fechaHasta) {
      query += ` AND t.transaction_date <= $${params.length + 1}`
      params.push(fechaHasta)
    }

    query += ` ORDER BY t.transaction_date DESC, tl.ticket2 DESC NULLS LAST, tl.ticket DESC NULLS LAST`

    const result = await sql.query(query, params)

    return NextResponse.json({ tickets: result.rows })
  } catch (error) {
    console.error("Error al obtener tickets directamente:", error)
    return NextResponse.json(
      { error: "Error al obtener tickets directamente", details: error.message },
      { status: 500 },
    )
  }
}
