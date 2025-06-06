import { unstable_noStore as noStore } from "next/cache"
import { sql } from "@vercel/postgres"

// Función para obtener las guías ICA de porcinos
export async function getGuiasIca(fechaInicio?: string, fechaFin?: string) {
  noStore()
  try {
    // Construir la consulta SQL con formato de fecha directamente en la consulta
    // Usamos EXTRACT para obtener los componentes de la fecha y construir manualmente el formato DD/MM/YYYY
    let query = `
      SELECT 
        t.id,
        LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
        LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
        EXTRACT(YEAR FROM t.fecha_documento)::text as fecha,
        t.numero_documento as numero_guia,
        c.primer_nombre || ' ' || c.primer_apellido as propietario,
        '' as procedencia,
        '' as destino,
        COALESCE(t.quantity_m, 0) + COALESCE(t.quantity_h, 0) as cantidad_total,
        COALESCE(t.quantity_m, 0) as cantidad_machos,
        COALESCE(t.quantity_h, 0) as cantidad_hembras
      FROM 
        transactions t
      LEFT JOIN 
        contacts c ON t.id_dueno_anterior = c.id
      WHERE 
        t.business_location_id = 2  -- Solo porcinos
        AND t.type = 'entry'  -- Solo guías ICA (entrada)
        AND t.activo = TRUE
    `

    // Agregar filtros de fecha si se proporcionan
    const params = []
    if (fechaInicio && fechaFin) {
      query += ` AND t.fecha_documento BETWEEN $1 AND $2`
      params.push(fechaInicio, fechaFin)
    }

    // Ordenar por fecha descendente
    query += ` ORDER BY t.fecha_documento DESC`

    // Ejecutar la consulta
    const result = await sql.query(query, params)

    // Mapear los resultados a la interfaz GuiaIcaItem
    const mappedResults = result.rows.map((row) => ({
      id: row.id,
      fecha: row.fecha,
      numeroGuia: row.numero_guia || "",
      propietario: row.propietario || "",
      procedencia: row.procedencia || "",
      destino: row.destino || "",
      cantidadTotal: Number(row.cantidad_total) || 0,
      cantidadMachos: Number(row.cantidad_machos) || 0,
      cantidadHembras: Number(row.cantidad_hembras) || 0,
    }))

    // Depurar fechas
    console.log(
      "Fechas de guías ICA (porcinos) desde la base de datos:",
      mappedResults.slice(0, 5).map((r) => ({
        id: r.id,
        fecha: r.fecha,
        numeroGuia: r.numeroGuia,
      })),
    )

    return mappedResults
  } catch (error) {
    console.error("Error al obtener guías ICA:", error)
    return []
  }
}

// Función para obtener las guías de degüello de porcinos
export async function getDeguellos(fechaInicio?: string, fechaFin?: string) {
  noStore()
  try {
    // Construir la consulta SQL con formato de fecha directamente en la consulta
    // Usamos EXTRACT para obtener los componentes de la fecha y construir manualmente el formato DD/MM/YYYY
    let query = `
      SELECT 
        t.id,
        LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
        LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
        EXTRACT(YEAR FROM t.fecha_documento)::text as fecha,
        t.numero_documento as numero_guia,
        c.primer_nombre || ' ' || c.primer_apellido as propietario,
        COALESCE(t.quantity_m, 0) + COALESCE(t.quantity_h, 0) as cantidad_total,
        COALESCE(t.quantity_m, 0) as cantidad_machos,
        COALESCE(t.quantity_h, 0) as cantidad_hembras,
        COALESCE(t.impuesto1, 0) as valor_deguello,
        COALESCE(t.impuesto2, 0) as valor_fondo,
        COALESCE(t.impuesto3, 0) as valor_matadero,
        COALESCE(t.total, 0) as total
      FROM 
        transactions t
      LEFT JOIN 
        contacts c ON t.id_dueno_anterior = c.id
      WHERE 
        t.business_location_id = 2  -- Solo porcinos
        AND t.type = 'exit'  -- Solo guías de degüello (salida)
        AND t.activo = TRUE
    `

    // Agregar filtros de fecha si se proporcionan
    const params = []
    if (fechaInicio && fechaFin) {
      query += ` AND t.fecha_documento BETWEEN $1 AND $2`
      params.push(fechaInicio, fechaFin)
    }

    // Ordenar por fecha descendente
    query += ` ORDER BY t.fecha_documento DESC`

    // Ejecutar la consulta
    const result = await sql.query(query, params)

    // Mapear los resultados a la interfaz DeguelloItem
    const mappedResults = result.rows.map((row) => ({
      id: row.id,
      fecha: row.fecha,
      numeroGuia: row.numero_guia || "",
      propietario: row.propietario || "",
      cantidadTotal: Number(row.cantidad_total) || 0,
      cantidadMachos: Number(row.cantidad_machos) || 0,
      cantidadHembras: Number(row.cantidad_hembras) || 0,
      valorDeguello: Number(row.valor_deguello) || 0,
      valorFondo: Number(row.valor_fondo) || 0,
      valorMatadero: Number(row.valor_matadero) || 0,
      total: Number(row.total) || 0,
    }))

    // Depurar fechas
    console.log(
      "Fechas de degüellos (porcinos) desde la base de datos:",
      mappedResults.slice(0, 5).map((r) => ({
        id: r.id,
        fecha: r.fecha,
        numeroGuia: r.numeroGuia,
      })),
    )

    return mappedResults
  } catch (error) {
    console.error("Error al obtener degüellos:", error)
    return []
  }
}
