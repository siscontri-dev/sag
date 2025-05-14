import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET(request: NextRequest, { params }: { params: { tipo: string } }) {
  try {
    const tipo = params.tipo

    // Validar el tipo
    if (tipo !== "bovinos" && tipo !== "porcinos") {
      return NextResponse.json({ error: "Tipo de animal no válido" }, { status: 400 })
    }

    // Determinar el business_location_id según el tipo de animal
    const businessLocationId = tipo === "bovinos" ? 1 : 2

    // Ejecutar la consulta exactamente como la proporcionó el usuario
    const result = await sql`
      SELECT
        t.id,
        t.numero_documento AS "Nº Guía",
        t.fecha_documento AS "Fecha",
        CONCAT_WS(' ', c.primer_nombre, c.segundo_nombre, c.primer_apellido, c.segundo_apellido) AS "Propietario",
        c.nit AS "NIT",
        TO_CHAR(t.quantity_m, 'FM999,999,999') AS "Machos",
        TO_CHAR(t.quantity_h, 'FM999,999,999') AS "Hembras",
        TO_CHAR(t.quantity_m + t.quantity_h, 'FM999,999,999') AS "Total Animales",
        TO_CHAR(t.quantity_k, 'FM999,999,999') AS "Kilos",
        TO_CHAR(t.total, 'FM999,999,999') AS "Total"
      FROM
        transactions t
      LEFT JOIN
        contacts c ON t.id_dueno_anterior = c.id
      WHERE
        t.type = 'entry'
        AND t.business_location_id = ${businessLocationId}
      ORDER BY
        t.fecha_documento DESC
      LIMIT 500
    `

    // Formatear las fechas en JavaScript
    const formattedData = result.rows.map((row) => {
      const fecha =
        row.Fecha instanceof Date
          ? row.Fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
          : ""

      return {
        ...row,
        Fecha: fecha,
      }
    })

    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.error(`Error al obtener datos ICA:`, error)
    return NextResponse.json(
      {
        error: "Error al obtener datos ICA",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
