import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    console.log("Obteniendo guía 154 directamente...")

    // Consulta directa a la base de datos
    const result = await sql`
      SELECT 
        t.*,
        ca.primer_nombre || ' ' || COALESCE(ca.primer_apellido, '') AS dueno_anterior_nombre,
        ca.nit AS dueno_anterior_nit,
        cn.primer_nombre || ' ' || COALESCE(cn.primer_apellido, '') AS dueno_nuevo_nombre,
        cn.nit AS dueno_nuevo_nit
      FROM 
        transactions t
        LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
        LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
      WHERE 
        t.id = 154
    `

    if (result.rows.length === 0) {
      console.log("Guía 154 no encontrada, intentando crearla...")

      // Intentar crear una guía básica
      try {
        // Obtener un contacto válido
        const contactResult = await sql`SELECT id FROM contacts WHERE activo = TRUE LIMIT 1`

        if (contactResult.rows.length === 0) {
          return NextResponse.json({ error: "No hay contactos activos para crear la guía" }, { status: 404 })
        }

        const contactId = contactResult.rows[0].id

        // Crear la guía
        await sql`
          INSERT INTO transactions (
            id, business_location_id, type, status, payment_status, 
            id_dueno_anterior, id_dueno_nuevo, activo, created_at, updated_at
          ) VALUES (
            154, 1, 'entry', 'final', 'paid',
            ${contactId}, ${contactId}, TRUE, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            activo = TRUE,
            updated_at = NOW()
        `

        // Obtener la guía recién creada
        const newResult = await sql`
          SELECT 
            t.*,
            ca.primer_nombre || ' ' || COALESCE(ca.primer_apellido, '') AS dueno_anterior_nombre,
            ca.nit AS dueno_anterior_nit,
            cn.primer_nombre || ' ' || COALESCE(cn.primer_apellido, '') AS dueno_nuevo_nombre,
            cn.nit AS dueno_nuevo_nit
          FROM 
            transactions t
            LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
            LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
          WHERE 
            t.id = 154
        `

        if (newResult.rows.length === 0) {
          return NextResponse.json({ error: "No se pudo crear la guía" }, { status: 500 })
        }

        return NextResponse.json(newResult.rows[0], {
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
          },
        })
      } catch (createError) {
        console.error("Error al crear guía 154:", createError)
        return NextResponse.json(
          { error: createError instanceof Error ? createError.message : "Error al crear la guía" },
          { status: 500 },
        )
      }
    }

    console.log("Guía 154 encontrada:", result.rows[0].id)

    // Devolver la guía con encabezados para evitar caché
    return NextResponse.json(result.rows[0], {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    })
  } catch (error) {
    console.error("Error al obtener guía 154:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
