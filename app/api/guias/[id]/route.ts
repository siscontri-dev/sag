import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Consulta para obtener los datos de la guía con información de contactos y ubicaciones
    const result = await sql`
      SELECT 
        t.*,
        ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
        ca.nit AS dueno_anterior_nit,
        cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
        cn.nit AS dueno_nuevo_nit,
        ua.direccion AS ubicacion_anterior_direccion,
        ua.nombre_finca AS ubicacion_anterior_nombre,
        un.direccion AS ubicacion_nueva_direccion,
        un.nombre_finca AS ubicacion_nueva_nombre,
        ca.marca,
        ca.imagen_url AS marca_imagen
      FROM 
        transactions t
      LEFT JOIN 
        contacts ca ON t.id_dueno_anterior = ca.id
      LEFT JOIN 
        contacts cn ON t.id_dueno_nuevo = cn.id
      LEFT JOIN 
        ubication_contact ua ON t.ubication_contact_id = ua.id
      LEFT JOIN 
        ubication_contact un ON t.ubication_contact_id2 = un.id
      WHERE 
        t.id = ${id}
        AND t.activo = TRUE
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Guía no encontrada" }, { status: 404 })
    }

    // Obtener las líneas de la transacción
    const linesResult = await sql`
      SELECT 
        tl.*,
        p.name AS product_name,
        r.name AS raza_nombre,
        c.name AS color_nombre,
        g.name AS genero_nombre
      FROM 
        transaction_lines tl
      LEFT JOIN 
        products p ON tl.product_id = p.id
      LEFT JOIN 
        razas r ON tl.raza_id = r.id
      LEFT JOIN 
        colores c ON tl.color_id = c.id
      LEFT JOIN 
        generos g ON tl.genero_id = g.id
      WHERE 
        tl.transaction_id = ${id}
    `

    // Combinar los datos
    const guia = {
      ...result.rows[0],
      transaction_lines: linesResult.rows,
    }

    return NextResponse.json(guia)
  } catch (error) {
    console.error("Error al obtener la guía:", error)
    return NextResponse.json({ error: "Error al obtener la guía" }, { status: 500 })
  }
}
