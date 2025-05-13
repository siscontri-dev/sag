"use server"

import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"
import { processObjectDates } from "@/lib/date-interceptor"

// Interfaz para los datos de guías ICA
export interface GuiaIcaItem {
  id: string
  fecha: string | Date
  numeroGuia: string
  propietario: string
  procedencia: string
  destino: string
  cantidadTotal: number
  cantidadMachos: number
  cantidadHembras: number
}

// Función para obtener las guías ICA de bovinos
export async function getGuiasIca(fechaInicio?: string, fechaFin?: string) {
  noStore()
  try {
    // Construir la consulta SQL
    let query = `
      SELECT 
        t.id,
        t.fecha_documento,
        t.numero_documento as numero_guia,
        c.name as propietario,
        t.procedencia,
        t.destino,
        COALESCE(t.quantity_m, 0) + COALESCE(t.quantity_h, 0) as cantidad_total,
        COALESCE(t.quantity_m, 0) as cantidad_machos,
        COALESCE(t.quantity_h, 0) as cantidad_hembras
      FROM 
        transactions t
      LEFT JOIN 
        contacts c ON t.contact_id = c.id
      WHERE 
        t.business_location_id = 1  -- Solo bovinos
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
      fecha: row.fecha_documento,
      numeroGuia: row.numero_guia || "",
      propietario: row.propietario || "",
      procedencia: row.procedencia || "",
      destino: row.destino || "",
      cantidadTotal: Number(row.cantidad_total) || 0,
      cantidadMachos: Number(row.cantidad_machos) || 0,
      cantidadHembras: Number(row.cantidad_hembras) || 0,
    }))

    // Procesar las fechas en los resultados
    return processObjectDates(mappedResults)
  } catch (error) {
    console.error("Error al obtener guías ICA:", error)
    return []
  }
}

// Interfaz para los datos de degüello
export interface DeguelloItem {
  id: string
  fecha: string | Date
  numeroGuia: string
  propietario: string
  cantidadTotal: number
  cantidadMachos: number
  cantidadHembras: number
  valorDeguello: number
  valorFondo: number
  valorMatadero: number
  total: number
}

// Función para obtener las guías de degüello de bovinos
export async function getDeguellos(fechaInicio?: string, fechaFin?: string) {
  noStore()
  try {
    // Construir la consulta SQL
    let query = `
      SELECT 
        t.id,
        t.fecha_documento,
        t.numero_documento as numero_guia,
        c.name as propietario,
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
        contacts c ON t.contact_id = c.id
      WHERE 
        t.business_location_id = 1  -- Solo bovinos
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
      fecha: row.fecha_documento,
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

    // Procesar las fechas en los resultados
    return processObjectDates(mappedResults)
  } catch (error) {
    console.error("Error al obtener degüellos:", error)
    return []
  }
}
