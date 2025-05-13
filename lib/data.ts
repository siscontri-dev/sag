import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"
import { processObjectDates } from "./date-interceptor"

// Function to get transaction statistics
export async function getTransactionStats() {
  try {
    // Get contact count
    const contactsResult = await sql`
      SELECT COUNT(*) as count FROM contacts WHERE activo = TRUE
    `

    // Get guias count
    const guiasResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry'
    `

    // Get sacrificios count
    const sacrificiosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit'
    `

    // Get bovinos guias count
    const guiasBovinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry' AND business_location_id = 1
    `

    // Get porcinos guias count
    const guiasPortinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry' AND business_location_id = 2
    `

    // Get bovinos sacrificios count
    const sacrificiosBovinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit' AND business_location_id = 1
    `

    // Get porcinos sacrificios count
    const sacrificiosPortinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit' AND business_location_id = 2
    `

    // Get total kilos
    const kilosResult = await sql`
      SELECT SUM(quantity) as total FROM transaction_lines
      JOIN transactions ON transaction_lines.transaction_id = transactions.id
      WHERE transactions.activo = TRUE
    `

    // Get recent transactions
    const recentTransactionsResult = await sql`
      SELECT 
        t.id, 
        t.numero_documento, 
        t.fecha_documento, 
        t.total, 
        t.type,
        c.primer_nombre || ' ' || c.primer_apellido AS dueno_anterior_nombre
      FROM 
        transactions t
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
      WHERE 
        t.activo = TRUE
      ORDER BY 
        t.fecha_documento DESC
      LIMIT 5
    `

    return {
      contactCount: Number.parseInt(contactsResult.rows[0]?.count || "0"),
      guiasCount: Number.parseInt(guiasResult.rows[0]?.count || "0"),
      sacrificiosCount: Number.parseInt(sacrificiosResult.rows[0]?.count || "0"),
      guiasBovinos: Number.parseInt(guiasBovinosResult.rows[0]?.count || "0"),
      guiasPorcinos: Number.parseInt(guiasPortinosResult.rows[0]?.count || "0"),
      sacrificiosBovinos: Number.parseInt(sacrificiosBovinosResult.rows[0]?.count || "0"),
      sacrificiosPorcinos: Number.parseInt(sacrificiosPortinosResult.rows[0]?.count || "0"),
      totalKilos: Number.parseFloat(kilosResult.rows[0]?.total || "0"),
      recentTransactions: recentTransactionsResult.rows || [],
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    // Return default values to avoid UI errors
    return {
      contactCount: 0,
      guiasCount: 0,
      sacrificiosCount: 0,
      guiasBovinos: 0,
      guiasPorcinos: 0,
      sacrificiosBovinos: 0,
      sacrificiosPorcinos: 0,
      totalKilos: 0,
      recentTransactions: [],
    }
  }
}

// Function to get financial data
export async function getFinancialData() {
  try {
    // Remove unstable_noStore() call to allow static rendering

    // Obtener todas las transacciones con sus impuestos
    const transactionsResult = await sql`
      SELECT 
        id,
        type,
        fecha_documento,
        business_location_id,
        total,
        impuesto1,
        impuesto2,
        impuesto3,
        quantity_m,
        quantity_h,
        quantity_k
      FROM 
        transactions
      WHERE 
        activo = TRUE
      ORDER BY 
        fecha_documento DESC
      LIMIT 100
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
      LIMIT 12
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
      transactions: transactionsResult.rows || [],
      monthlyStats: (monthlyStatsResult.rows || []).map((row) => ({
        ...row,
        mes: row.mes ? row.mes.toISOString().split("T")[0].substring(0, 7) : "",
      })),
      animalTypeStats: animalTypeStatsResult.rows || [],
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

// Function to get taxes
export async function getTaxes() {
  try {
    const result = await sql`
      SELECT 
        t.*,
        l.nombre as location_nombre,
        CASE 
          WHEN l.id = 1 THEN 'bovino'
          WHEN l.id = 2 THEN 'porcino'
          ELSE 'otro'
        END as location_tipo
      FROM 
        taxes t
        JOIN locations l ON t.location_id = l.id
      WHERE 
        t.activo = true
      ORDER BY 
        l.id, t.nombre
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener impuestos:", error)
    return []
  }
}

// Function to get taxes by location type
export async function getTaxesByLocationType(tipo: string) {
  try {
    // Map tipo to location_id
    let locationId
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    } else {
      console.error(`Tipo de ubicación inválido: ${tipo}`)
      return []
    }

    const result = await sql`
      SELECT 
        t.*,
        l.nombre as location_nombre,
        CASE 
          WHEN l.id = 1 THEN 'bovino'
          WHEN l.id = 2 THEN 'porcino'
          ELSE 'otro'
        END as location_tipo
      FROM 
        taxes t
        JOIN locations l ON t.location_id = l.id
      WHERE 
        t.location_id = ${locationId} AND t.activo = true
      ORDER BY 
        t.nombre
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener impuestos por tipo:", error)
    return []
  }
}

// Function to get departamentos
export async function getDepartamentos() {
  try {
    const result = await sql`
      SELECT id, name as nombre, cod_dian FROM departamentos 
      WHERE activo = TRUE 
      ORDER BY name
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener departamentos:", error)
    return []
  }
}

// Function to get consignantes by location id
export async function getConsignantesByLocationId(locationId: number) {
  try {
    const result = await sql`
      SELECT id, nombre
      FROM consignantes
      WHERE location_id = ${locationId} AND activo = TRUE
      ORDER BY nombre
    `
    return result.rows
  } catch (error) {
    console.error(`Error al obtener consignantes para location_id ${locationId}:`, error)
    return []
  }
}

// Function to get ubicaciones by contacto
export async function getUbicacionesByContacto(contactId: number) {
  try {
    const result = await sql`
      SELECT 
        uc.*,
        d.name as departamento_nombre,
        m.name as municipio_nombre
      FROM 
        ubication_contact uc
        JOIN departamentos d ON uc.id_departamento = d.id
        JOIN municipios m ON uc.id_municipio = m.id
      WHERE 
        uc.id_contact = ${contactId} AND uc.activo = TRUE
      ORDER BY 
        uc.es_principal DESC, uc.nombre_finca
    `
    return result.rows
  } catch (error) {
    console.error(`Error al obtener ubicaciones para contacto ${contactId}:`, error)
    return []
  }
}

// Function to get municipios by departamento
export async function getMunicipiosByDepartamento(departamentoId: number) {
  try {
    const result = await sql`
      SELECT id, name as nombre, cod_dian 
      FROM municipios 
      WHERE id_departamento = ${departamentoId} AND activo = TRUE
      ORDER BY name
    `
    return result.rows
  } catch (error) {
    console.error(`Error al obtener municipios para departamento ${departamentoId}:`, error)
    return []
  }
}

// Function to get transaction by ID
export async function getTransactionById(id: string) {
  try {
    // Query the main transaction
    const transactionResult = await sql`
      SELECT t.*, 
             c1.primer_nombre || ' ' || c1.primer_apellido as dueno_anterior_nombre,
             c1.nit as dueno_anterior_nit,
             c2.primer_nombre || ' ' || c2.primer_apellido as dueno_nuevo_nombre,
             c2.nit as dueno_nuevo_nit
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno_anterior = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      WHERE t.id = ${id} AND t.activo = true
    `

    if (transactionResult.rows.length === 0) {
      return null
    }

    const transaction = transactionResult.rows[0]

    // Query the transaction lines
    const linesResult = await sql`
      SELECT tl.*, 
             p.name as product_name,
             r.name as raza_nombre,
             c.name as color_nombre
      FROM transaction_lines tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors c ON tl.color_id = c.id
      WHERE tl.transaction_id = ${id}
      ORDER BY tl.id
    `

    // Add the lines to the transaction
    transaction.transaction_lines = linesResult.rows

    return transaction
  } catch (error) {
    console.error(`Error al obtener transacción ID ${id}:`, error)
    return null
  }
}

// Function to get tax by ID
export async function getTaxById(id: string) {
  try {
    const result = await sql`
      SELECT 
        t.*,
        l.nombre as location_nombre,
        CASE 
          WHEN l.id = 1 THEN 'bovino'
          WHEN l.id = 2 THEN 'porcino'
          ELSE 'otro'
        END as location_tipo
      FROM 
        taxes t
        JOIN locations l ON t.location_id = l.id
      WHERE 
        t.id = ${id} AND t.activo = true
    `
    return result.rows[0] || null
  } catch (error) {
    console.error("Error al obtener impuesto:", error)
    return null
  }
}

// Function to get contacts
export async function getContacts(businessLocationId = null) {
  try {
    if (businessLocationId) {
      const result = await sql`
        SELECT * FROM contacts 
        WHERE activo = TRUE AND business_location_id = ${businessLocationId}
        ORDER BY primer_nombre, primer_apellido
        LIMIT 100
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM contacts 
        WHERE activo = TRUE 
        ORDER BY primer_nombre, primer_apellido
        LIMIT 100
      `
      return result.rows
    }
  } catch (error) {
    console.error("Error al obtener contactos:", error)
    return []
  }
}

// Function to get contact by ID
export async function getContactById(id) {
  try {
    const contactResult = await sql`
      SELECT * FROM contacts WHERE id = ${id} AND activo = TRUE
    `

    if (contactResult.rows.length === 0) {
      return null
    }

    return { contact: contactResult.rows[0] }
  } catch (error) {
    console.error(`Error al obtener contacto con ID ${id}:`, error)
    return { contact: null }
  }
}

// Function to get locations
export async function getLocations() {
  try {
    const result = await sql`
      SELECT * FROM locations WHERE activo = TRUE ORDER BY nombre
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener ubicaciones:", error)
    return []
  }
}

// Function to get products
export async function getProducts(tipo = undefined, locationId = undefined) {
  try {
    if (tipo && locationId) {
      const result = await sql`
        SELECT * FROM products 
        WHERE activo = TRUE 
        AND tipo_animal = ${tipo}
        AND business_location_id = ${locationId}
        ORDER BY name
      `
      return result.rows
    } else if (tipo) {
      const result = await sql`
        SELECT * FROM products 
        WHERE activo = TRUE AND tipo_animal = ${tipo}
        ORDER BY name
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM products WHERE activo = TRUE ORDER BY name
      `
      return result.rows
    }
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Función para obtener transacciones (guías o sacrificios)
export async function getTransactions(tipo_transaccion: "entry" | "sell" = "entry", tipo_animal?: string, limit = 30) {
  try {
    let query = `
      SELECT 
        t.*, 
        c1.nombre as propietario_nombre, 
        c1.apellido as propietario_apellido,
        c1.nit as propietario_nit,
        c2.nombre as comprador_nombre, 
        c2.apellido as comprador_apellido,
        c2.nit as comprador_nit,
        uc1.nombre as ubicacion_contacto_nombre,
        uc2.nombre as ubicacion_contacto_nombre2
      FROM 
        transactions t
      LEFT JOIN 
        contacts c1 ON t.contact_id = c1.id
      LEFT JOIN 
        contacts c2 ON t.customer_id = c2.id
      LEFT JOIN
        ubication_contact uc1 ON t.ubication_contact_id = uc1.id
      LEFT JOIN
        ubication_contact uc2 ON t.ubication_contact_id2 = uc2.id
      WHERE 
        t.tipo_transaccion = $1
    `

    const params: any[] = [tipo_transaccion]

    // Filtrar por tipo de animal si se proporciona
    if (tipo_animal) {
      query += ` AND t.tipo_animal = $2`
      params.push(tipo_animal)
    }

    // Ordenar por fecha de documento (más reciente primero) y luego por ID
    query += ` ORDER BY t.fecha_documento DESC, t.id DESC`

    // Limitar resultados si se especifica
    if (limit > 0) {
      query += ` LIMIT $${params.length + 1}`
      params.push(limit)
    }

    const result = await sql.query(query, params)

    // Procesar fechas para asegurar que sean strings
    return processObjectDates(result.rows)
  } catch (error) {
    console.error("Error al obtener transacciones:", error)
    throw error
  }
}

// Función para obtener líneas de tickets
export async function getTicketsLines(tipo_animal?: string, limit = 30) {
  try {
    let query = `
      SELECT 
        tl.*,
        t.tipo_animal,
        t.fecha_documento,
        t.numero_documento,
        c.nombre as propietario_nombre,
        c.apellido as propietario_apellido,
        c.nit as propietario_nit
      FROM 
        transaction_lines tl
      JOIN 
        transactions t ON tl.transaction_id = t.id
      LEFT JOIN 
        contacts c ON t.contact_id = c.id
      WHERE 
        t.tipo_transaccion = 'entry'
    `

    const params: any[] = []

    // Filtrar por tipo de animal si se proporciona
    if (tipo_animal) {
      query += ` AND t.tipo_animal = $1`
      params.push(tipo_animal)
    }

    // Ordenar por fecha de documento (más reciente primero) y luego por ID
    query += ` ORDER BY t.fecha_documento DESC, tl.id DESC`

    // Limitar resultados si se especifica
    if (limit > 0) {
      query += ` LIMIT $${params.length + 1}`
      params.push(limit)
    }

    const result = await sql.query(query, params)

    // Procesar fechas para asegurar que sean strings
    return processObjectDates(result.rows)
  } catch (error) {
    console.error("Error al obtener líneas de tickets:", error)
    throw error
  }
}

export async function getReportData() {
  noStore()
  try {
    const totalGuiasResult = await sql`
      SELECT COUNT(*) FROM transactions WHERE type = 'entry' AND activo = TRUE
    `
    const totalSacrificiosResult = await sql`
      SELECT COUNT(*) FROM transactions WHERE type = 'exit' AND activo = TRUE
    `
    const totalKilosResult = await sql`
      SELECT SUM(quantity_k) FROM transactions WHERE activo = TRUE
    `
    const totalValorResult = await sql`
      SELECT SUM(total) FROM transactions WHERE activo = TRUE
    `

    const guiasResult = await sql`
      SELECT 
        id,
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        total,
        quantity_k,
        dueno_anterior_nombre,
        tipo_animal
      FROM (
        SELECT 
          t.id,
          t.numero_documento,
          t.fecha_documento,
          t.id_dueno_anterior,
          t.id_dueno_nuevo,
          t.total,
          t.quantity_k,
          c.primer_nombre || ' ' || c.primer_apellido AS dueno_anterior_nombre,
          CASE 
            WHEN t.business_location_id = 1 THEN 'Bovino'
            WHEN t.business_location_id = 2 THEN 'Porcino'
            ELSE 'Desconocido'
          END as tipo_animal
        FROM transactions t
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        WHERE t.type = 'entry' AND t.activo = TRUE
        ORDER BY t.fecha_documento DESC
        LIMIT 5
      ) as subquery
    `

    const sacrificiosResult = await sql`
      SELECT 
        id,
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        total,
        quantity_k,
        dueno_anterior_nombre,
        tipo_animal
      FROM (
        SELECT 
          t.id,
          t.numero_documento,
          t.fecha_documento,
          t.id_dueno_anterior,
          t.id_dueno_nuevo,
          t.total,
          t.quantity_k,
          c.primer_nombre || ' ' || c.primer_apellido AS dueno_anterior_nombre,
          CASE 
            WHEN t.business_location_id = 1 THEN 'Bovino'
            WHEN t.business_location_id = 2 THEN 'Porcino'
            ELSE 'Desconocido'
          END as tipo_animal
        FROM transactions t
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        WHERE t.type = 'exit' AND t.activo = TRUE
        ORDER BY t.fecha_documento DESC
        LIMIT 5
      ) as subquery
    `

    const contactosResult = await sql`
      SELECT 
        c.id,
        c.primer_nombre || ' ' || c.primer_apellido AS nombre,
        c.nit,
        c.type,
        SUM(CASE WHEN t.type = 'entry' THEN 1 ELSE 0 END) AS guias,
        SUM(CASE WHEN t.type = 'exit' THEN 1 ELSE 0 END) AS sacrificios,
        SUM(t.quantity_k) AS kilos,
        SUM(t.total) AS valor
      FROM contacts c
      LEFT JOIN transactions t ON c.id = t.id_dueno_anterior
      WHERE c.activo = TRUE
      GROUP BY c.id, c.primer_nombre, c.primer_apellido, c.nit, c.type
      ORDER BY nombre
      LIMIT 5
    `

    return {
      totalGuias: Number(totalGuiasResult.rows[0].count),
      totalSacrificios: Number(totalSacrificiosResult.rows[0].count),
      totalKilos: Number(totalKilosResult.rows[0].sum) || 0,
      totalValor: Number(totalValorResult.rows[0].sum) || 0,
      nuevasGuias: 10,
      nuevosSacrificios: 5,
      nuevosKilos: 1000,
      nuevoValor: 500000,
      bovinosKilos: 6000,
      porcinosKilos: 4000,
      guias: guiasResult.rows,
      sacrificios: sacrificiosResult.rows,
      contactos: contactosResult.rows,
    }
  } catch (error) {
    console.error("Error al generar reporte:", error)
    return {
      totalGuias: 0,
      totalSacrificios: 0,
      totalKilos: 0,
      totalValor: 0,
      nuevasGuias: 0,
      nuevosSacrificios: 0,
      nuevosKilos: 0,
      nuevoValor: 0,
      bovinosKilos: 0,
      porcinosKilos: 0,
      guias: [],
      sacrificios: [],
      contactos: [],
    }
  }
}
