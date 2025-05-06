"use server"

import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"

// Interfaz para los datos del informe diario
export interface InformeDiarioItem {
  fecha: string
  ticketsGM: string
  cantidadGM: number
  valorUnitarioGM: number
  totalGM: number
  ticketsGMen: string
  cantidadGMen: number
  valorUnitarioGMen: number
  totalGMen: number
  ticketsCorralaje: string
  cantidadCorralaje: number
  valorUnitarioCorralaje: number
  totalCorralaje: number
  total: number
  numeroInforme: number
}

// Función para obtener datos del informe diario de báscula y corralaje
export async function getInformeDiarioBasculaCorralaje(
  tipo: "bovino" | "porcino",
  fechaInicio: string,
  fechaFin: string,
) {
  noStore()
  try {
    // Determinar el ID de ubicación basado en el tipo
    const locationId = tipo === "bovino" ? 1 : 2

    // Consulta para obtener los tickets agrupados por día
    const result = await sql`
      WITH ticket_data AS (
        SELECT 
          DATE(fecha_documento) as fecha,
          MIN(ticket_number) as min_ticket,
          MAX(ticket_number) as max_ticket,
          COUNT(*) as cantidad,
          AVG(COALESCE(valor_unitario, 0)) as valor_unitario,
          SUM(COALESCE(valor_unitario, 0)) as total,
          ticket_type
        FROM 
          ticket_counters
        WHERE 
          business_location_id = ${locationId}
          AND fecha_documento BETWEEN ${fechaInicio} AND ${fechaFin}
          AND activo = TRUE
        GROUP BY 
          DATE(fecha_documento), ticket_type
        ORDER BY 
          fecha, ticket_type
      )
      SELECT 
        fecha,
        
        -- G/M (Ganado Mayor)
        (SELECT min_ticket || '-' || max_ticket FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GM') as tickets_gm,
        (SELECT cantidad FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GM') as cantidad_gm,
        (SELECT valor_unitario FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GM') as valor_unitario_gm,
        (SELECT total FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GM') as total_gm,
        
        -- G/Men (Ganado Menor)
        (SELECT min_ticket || '-' || max_ticket FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GMen') as tickets_gmen,
        (SELECT cantidad FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GMen') as cantidad_gmen,
        (SELECT valor_unitario FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GMen') as valor_unitario_gmen,
        (SELECT total FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'GMen') as total_gmen,
        
        -- Corralaje
        (SELECT min_ticket || '-' || max_ticket FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'Corralaje') as tickets_corralaje,
        (SELECT cantidad FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'Corralaje') as cantidad_corralaje,
        (SELECT valor_unitario FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'Corralaje') as valor_unitario_corralaje,
        (SELECT total FROM ticket_data td 
         WHERE td.fecha = t.fecha AND td.ticket_type = 'Corralaje') as total_corralaje,
        
        -- Total general por día
        (SELECT SUM(total) FROM ticket_data td WHERE td.fecha = t.fecha) as total,
        
        -- Número de informe (usamos ROW_NUMBER para generar un número secuencial)
        ROW_NUMBER() OVER (ORDER BY fecha) as numero_informe
      FROM 
        (SELECT DISTINCT fecha FROM ticket_data) t
      ORDER BY 
        fecha
    `

    // Mapear los resultados a la interfaz InformeDiarioItem
    return result.rows.map((row) => ({
      fecha: row.fecha.toISOString().split("T")[0],
      ticketsGM: row.tickets_gm || "",
      cantidadGM: Number.parseInt(row.cantidad_gm) || 0,
      valorUnitarioGM: Number.parseFloat(row.valor_unitario_gm) || 0,
      totalGM: Number.parseFloat(row.total_gm) || 0,
      ticketsGMen: row.tickets_gmen || "",
      cantidadGMen: Number.parseInt(row.cantidad_gmen) || 0,
      valorUnitarioGMen: Number.parseFloat(row.valor_unitario_gmen) || 0,
      totalGMen: Number.parseFloat(row.total_gmen) || 0,
      ticketsCorralaje: row.tickets_corralaje || "",
      cantidadCorralaje: Number.parseInt(row.cantidad_corralaje) || 0,
      valorUnitarioCorralaje: Number.parseFloat(row.valor_unitario_corralaje) || 0,
      totalCorralaje: Number.parseFloat(row.total_corralaje) || 0,
      total: Number.parseFloat(row.total) || 0,
      numeroInforme: Number.parseInt(row.numero_informe) || 0,
    }))
  } catch (error) {
    console.error("Error al obtener informe diario:", error)
    return []
  }
}

// Interfaz para los datos del boletín de movimiento de ganado mayor bovinos
export interface BoletinGanadoItem {
  id: string
  fecha: string
  numeroGuiaIca: string
  cantidadTotal: number
  cantidadMachos: number
  cantidadHembras: number
  cantidadKilos: number
  valorDeguello: number
  servicioMatadero: number
  fondoFedegan: number
  total: number
  numeroBoletin: number
}

// Función para obtener datos del boletín de movimiento de ganado mayor bovinos
export async function getBoletinGanadoMayor(fechaInicio: string, fechaFin: string) {
  noStore()
  try {
    // Consulta para obtener las transacciones de bovinos (location_id = 1)
    // Usando los nombres correctos de los campos de impuestos
    const result = await sql`
      SELECT 
        t.id,
        t.fecha_documento,
        t.numero_documento as numero_guia_ica,
        COALESCE(t.quantity_m, 0) + COALESCE(t.quantity_h, 0) as cantidad_total,
        COALESCE(t.quantity_m, 0) as cantidad_machos,
        COALESCE(t.quantity_h, 0) as cantidad_hembras,
        COALESCE(t.quantity_k, 0) as cantidad_kilos,
        
        -- Valores de impuestos con los nombres correctos
        COALESCE(t.impuesto1, 0) as valor_deguello,     -- impuesto1 = deguello
        COALESCE(t.impuesto3, 0) as servicio_matadero,  -- impuesto3 = matadero
        COALESCE(t.impuesto2, 0) as fondo_fedegan,      -- impuesto2 = Fondo
        
        COALESCE(t.total, 0) as total,
        
        -- Número de boletín (usamos ROW_NUMBER para generar un número secuencial)
        ROW_NUMBER() OVER (ORDER BY t.fecha_documento) as numero_boletin
      FROM 
        transactions t
      WHERE 
        t.business_location_id = 1  -- Solo bovinos
        AND t.type = 'exit'  -- Solo sacrificios
        AND t.activo = TRUE
        AND t.fecha_documento BETWEEN ${fechaInicio} AND ${fechaFin}
      ORDER BY 
        t.fecha_documento
    `

    // Mapear los resultados a la interfaz BoletinGanadoItem
    return result.rows.map((row) => ({
      id: row.id,
      fecha: row.fecha_documento.toISOString().split("T")[0],
      numeroGuiaIca: row.numero_guia_ica || "",
      cantidadTotal: Number.parseInt(row.cantidad_total) || 0,
      cantidadMachos: Number.parseInt(row.cantidad_machos) || 0,
      cantidadHembras: Number.parseInt(row.cantidad_hembras) || 0,
      cantidadKilos: Number.parseFloat(row.cantidad_kilos) || 0,
      valorDeguello: Number.parseFloat(row.valor_deguello) || 0,
      servicioMatadero: Number.parseFloat(row.servicio_matadero) || 0,
      fondoFedegan: Number.parseFloat(row.fondo_fedegan) || 0,
      total: Number.parseFloat(row.total) || 0,
      numeroBoletin: Number.parseInt(row.numero_boletin) || 0,
    }))
  } catch (error) {
    console.error("Error al obtener boletín de ganado mayor:", error)
    return []
  }
}

// Función para exportar el informe a Excel
export async function exportarInformeBasculaCorralaje(
  tipo: "bovino" | "porcino",
  fechaInicio: string,
  fechaFin: string,
) {
  try {
    // Obtener los datos del informe
    const datos = await getInformeDiarioBasculaCorralaje(tipo, fechaInicio, fechaFin)

    // Aquí iría la lógica para generar el Excel
    // Por ahora, solo devolvemos un mensaje de éxito
    return { success: true, message: "Exportación exitosa", data: datos }
  } catch (error) {
    console.error("Error al exportar informe:", error)
    return { success: false, message: "Error al exportar informe" }
  }
}

// Función para exportar el boletín a Excel
export async function exportarBoletinGanadoMayor(fechaInicio: string, fechaFin: string) {
  try {
    // Obtener los datos del boletín
    const datos = await getBoletinGanadoMayor(fechaInicio, fechaFin)

    // Aquí iría la lógica para generar el Excel
    // Por ahora, solo devolvemos un mensaje de éxito
    return { success: true, message: "Exportación exitosa", data: datos }
  } catch (error) {
    console.error("Error al exportar boletín:", error)
    return { success: false, message: "Error al exportar boletín" }
  }
}

// Nueva función para obtener datos financieros completos
export async function getFinancialData() {
  noStore()
  try {
    // Obtener todas las transacciones con sus impuestos
    const transactionsResult = await sql`
      SELECT 
        id,
        type,
        fecha_documento,
        business_location_id,
        total,
        impuesto1, -- Deguello
        impuesto2, -- Fondo
        impuesto3, -- Matadero
        quantity_m,
        quantity_h,
        quantity_k
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
    `

    // Obtener estadísticas de impuestos por mes
    const monthlyStatsResult = await sql`
      SELECT 
        DATE_TRUNC('month', fecha_documento) as mes,
        SUM(CASE WHEN type = 'entry' THEN total ELSE 0 END) as total_guias,
        SUM(CASE WHEN type = 'exit' THEN total ELSE 0 END) as total_sacrificios,
        SUM(CASE WHEN type = 'exit' THEN impuesto1 ELSE 0 END) as total_deguello,
        SUM(CASE WHEN type = 'exit' THEN impuesto2 ELSE 0 END) as total_fondo,
        SUM(CASE WHEN type = 'exit' THEN impuesto3 ELSE 0 END) as total_matadero,
        COUNT(CASE WHEN type = 'entry' THEN 1 END) as count_guias,
        COUNT(CASE WHEN type = 'exit' THEN 1 END) as count_sacrificios
      FROM 
        transactions
      WHERE 
        activo = TRUE
      GROUP BY 
        DATE_TRUNC('month', fecha_documento)
      ORDER BY 
        mes DESC
    `

    // Obtener estadísticas por tipo de animal (bovino/porcino)
    const animalTypeStatsResult = await sql`
      SELECT 
        business_location_id,
        SUM(CASE WHEN type = 'entry' THEN total ELSE 0 END) as total_guias,
        SUM(CASE WHEN type = 'exit' THEN total ELSE 0 END) as total_sacrificios,
        SUM(CASE WHEN type = 'exit' THEN impuesto1 ELSE 0 END) as total_deguello,
        SUM(CASE WHEN type = 'exit' THEN impuesto2 ELSE 0 END) as total_fondo,
        SUM(CASE WHEN type = 'exit' THEN impuesto3 ELSE 0 END) as total_matadero,
        COUNT(CASE WHEN type = 'entry' THEN 1 END) as count_guias,
        COUNT(CASE WHEN type = 'exit' THEN 1 END) as count_sacrificios
      FROM 
        transactions
      WHERE 
        activo = TRUE
      GROUP BY 
        business_location_id
    `

    return {
      transactions: transactionsResult.rows,
      monthlyStats: monthlyStatsResult.rows.map((row) => ({
        ...row,
        mes: row.mes.toISOString().split("T")[0].substring(0, 7), // Formato YYYY-MM
      })),
      animalTypeStats: animalTypeStatsResult.rows,
    }
  } catch (error) {
    console.error("Error al obtener datos financieros:", error)
    return {
      transactions: [],
      monthlyStats: [],
      animalTypeStats: [],
    }
  }
}
