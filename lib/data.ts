import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"

// Función para obtener datos de reportes
export async function getReportData() {
  try {
    // Obtener datos de guías
    const guiasResult = await sql`
      SELECT 
        t.*,
        TO_CHAR(t.fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_documento_formatted,
        ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
        cn.primer_nombre || ' ' || ca.primer_apellido AS dueno_nuevo_nombre,
        SUM(tl.quantity) as kilos
      FROM 
        transactions t
        LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
        LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        t.activo = TRUE AND t.type = 'entry'
      GROUP BY
        t.id, ca.primer_nombre, ca.primer_apellido, cn.primer_nombre, cn.primer_apellido
      ORDER BY 
        t.fecha_documento DESC
      LIMIT 10
    `

    // Obtener datos de sacrificios
    const sacrificiosResult = await sql`
      SELECT 
        t.*,
        TO_CHAR(t.fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_documento_formatted,
        ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
        SUM(tl.quantity) as kilos,
        SUM(tl.quantity_m) as machos,
        SUM(tl.quantity_h) as hembras
      FROM 
        transactions t
        LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
        LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        t.activo = TRUE AND t.type = 'exit'
      GROUP BY
        t.id, ca.primer_nombre, ca.primer_apellido
      ORDER BY 
        t.fecha_documento DESC
      LIMIT 10
    `

    // Obtener estadísticas generales
    const statsResult = await sql`
      SELECT 
        COUNT(CASE WHEN t.type = 'entry' THEN 1 END) as total_guias,
        COUNT(CASE WHEN t.type = 'exit' THEN 1 END) as total_sacrificios,
        SUM(tl.quantity) as total_kilos,
        0 as bovinos_kilos,
        0 as porcinos_kilos,
        SUM(t.total) as total_valor
      FROM 
        transactions t
        LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        t.activo = TRUE
    `

    // Obtener datos de contactos
    const contactosResult = await sql`
      SELECT 
        c.id,
        c.nit,
        c.primer_nombre || ' ' || c.primer_apellido AS nombre,
        c.type,
        COUNT(DISTINCT CASE WHEN t.type = 'entry' THEN t.id END) as guias,
        COUNT(DISTINCT CASE WHEN t.type = 'exit' THEN t.id END) as sacrificios,
        SUM(tl.quantity) as kilos,
        SUM(t.total) as valor
      FROM 
        contacts c
        LEFT JOIN transactions t ON (t.id_dueno_anterior = c.id OR t.id_dueno_nuevo = c.id)
        LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        c.activo = TRUE
      GROUP BY
        c.id, c.nit, c.primer_nombre, c.primer_apellido, c.type
      ORDER BY 
        valor DESC NULLS LAST
      LIMIT 10
    `

    // Datos para este mes
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const monthStatsResult = await sql`
      SELECT 
        COUNT(CASE WHEN t.type = 'entry' THEN 1 END) as nuevas_guias,
        COUNT(CASE WHEN t.type = 'exit' THEN 1 END) as nuevos_sacrificios,
        SUM(tl.quantity) as nuevos_kilos,
        SUM(t.total) as nuevo_valor
      FROM 
        transactions t
        LEFT JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        t.activo = TRUE
        AND t.fecha_documento >= ${firstDayOfMonth.toISOString()}
    `

    const stats = statsResult.rows[0]
    const monthStats = monthStatsResult.rows[0]

    // Procesar los resultados para usar la fecha formateada
    const guiasProcessed = guiasResult.rows.map((guia) => ({
      ...guia,
      fecha_documento: guia.fecha_documento_formatted,
    }))

    const sacrificiosProcessed = sacrificiosResult.rows.map((sacrificio) => ({
      ...sacrificio,
      fecha_documento: sacrificio.fecha_documento_formatted,
    }))

    return {
      guias: guiasProcessed,
      sacrificios: sacrificiosProcessed,
      contactos: contactosResult.rows,
      totalGuias: Number.parseInt(stats.total_guias) || 0,
      totalSacrificios: Number.parseInt(stats.total_sacrificios) || 0,
      totalKilos: Number.parseFloat(stats.total_kilos) || 0,
      bovinosKilos: Number.parseFloat(stats.bovinos_kilos) || 0,
      porcinosKilos: Number.parseFloat(stats.porcinos_kilos) || 0,
      totalValor: Number.parseFloat(stats.total_valor) || 0,
      nuevasGuias: Number.parseInt(monthStats.nuevas_guias) || 0,
      nuevosSacrificios: Number.parseInt(monthStats.nuevos_sacrificios) || 0,
      nuevosKilos: Number.parseFloat(monthStats.nuevos_kilos) || 0,
      nuevoValor: Number.parseFloat(monthStats.nuevo_valor) || 0,
    }
  } catch (error) {
    console.error("Error al obtener datos para reportes:", error)
    return {
      guias: [],
      sacrificios: [],
      contactos: [],
      totalGuias: 0,
      totalSacrificios: 0,
      totalKilos: 0,
      bovinosKilos: 0,
      porcinosKilos: 0,
      totalValor: 0,
      nuevasGuias: 0,
      nuevosSacrificios: 0,
      nuevosKilos: 0,
      nuevoValor: 0,
    }
  }
}

// Función para obtener estadísticas de transacciones
export async function getTransactionStats() {
  // Mantenemos noStore() para asegurar datos frescos
  noStore()
  try {
    // Obtener conteo de contactos
    const contactsResult = await sql`
      SELECT COUNT(*) as count FROM contacts WHERE activo = TRUE
    `

    // Obtener conteo de guías
    const guiasResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry'
    `

    // Obtener conteo de sacrificios
    const sacrificiosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit'
    `

    // Obtener conteo de guías por ubicación (bovinos - location_id = 1)
    const guiasBovinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry' AND business_location_id = 1
    `

    // Obtener conteo de guías por ubicación (porcinos - location_id = 2)
    const guiasPortinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'entry' AND business_location_id = 2
    `

    // Obtener conteo de sacrificios por ubicación (bovinos - location_id = 1)
    const sacrificiosBovinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit' AND business_location_id = 1
    `

    // Obtener conteo de sacrificios por ubicación (porcinos - location_id = 2)
    const sacrificiosPortinosResult = await sql`
      SELECT COUNT(*) as count FROM transactions 
      WHERE activo = TRUE AND type = 'exit' AND business_location_id = 2
    `

    // Obtener total de kilos procesados
    const kilosResult = await sql`
      SELECT SUM(quantity) as total FROM transaction_lines
      JOIN transactions ON transaction_lines.transaction_id = transactions.id
      WHERE transactions.activo = TRUE
    `

    // Obtener transacciones recientes
    const recentTransactionsResult = await sql`
      SELECT 
        t.id, 
        t.numero_documento, 
        TO_CHAR(t.fecha_documento AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY') as fecha_documento, 
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
    // Devolver valores por defecto para evitar errores en la UI
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

// Función para obtener contactos
export async function getContacts(businessLocationId = null) {
  try {
    if (businessLocationId) {
      const result = await sql`
        SELECT * FROM contacts 
        WHERE activo = TRUE AND business_location_id = ${businessLocationId}
        ORDER BY primer_nombre, primer_apellido
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM contacts WHERE activo = TRUE ORDER BY primer_nombre, primer_apellido
      `
      return result.rows
    }
  } catch (error) {
    console.error("Error al obtener contactos:", error)
    return []
  }
}

// Función para obtener un contacto por ID
export async function getContactById(id) {
  try {
    // Obtener el contacto
    const contactResult = await sql`
      SELECT * FROM contacts WHERE id = ${id} AND activo = TRUE
    `

    if (contactResult.rows.length === 0) {
      return null
    }

    const contact = contactResult.rows[0]

    return { contact }
  } catch (error) {
    console.error(`Error al obtener contacto con ID ${id}:`, error)
    return { contact: null }
  }
}

// Función para obtener ubicaciones
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

// Modificar la función getProducts para filtrar por ubicación
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

// Modificar la función getTransactions para manejar correctamente la zona horaria
export async function getTransactions(type = undefined, tipoAnimal = undefined) {
  try {
    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipoAnimal === "bovino") {
      locationId = 1
    } else if (tipoAnimal === "porcino") {
      locationId = 2
    }

    if (type && locationId) {
      const result = await sql`
        SELECT 
          t.id,
          t.numero_documento,
          LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
          LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
          EXTRACT(YEAR FROM t.fecha_documento)::text as fecha_documento,
          t.estado,
          t.total,
          t.quantity_m,
          t.quantity_h,
          t.quantity_k,
          t.impuesto1,
          t.impuesto2,
          t.impuesto3,
          t.business_location_id,
          t.type,
          t.activo,
          t.id_dueno_anterior,
          t.id_dueno_nuevo,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = ${type} AND t.business_location_id = ${locationId}
        ORDER BY 
          t.fecha_documento DESC
      `
      return result.rows
    } else if (type) {
      const result = await sql`
        SELECT 
          t.id,
          t.numero_documento,
          LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
          LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
          EXTRACT(YEAR FROM t.fecha_documento)::text as fecha_documento,
          t.estado,
          t.total,
          t.quantity_m,
          t.quantity_h,
          t.quantity_k,
          t.impuesto1,
          t.impuesto2,
          t.impuesto3,
          t.business_location_id,
          t.type,
          t.activo,
          t.id_dueno_anterior,
          t.id_dueno_nuevo,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = ${type}
        ORDER BY 
          t.fecha_documento DESC
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT 
          t.id,
          t.numero_documento,
          LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
          LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
          EXTRACT(YEAR FROM t.fecha_documento)::text as fecha_documento,
          t.estado,
          t.total,
          t.quantity_m,
          t.quantity_h,
          t.quantity_k,
          t.impuesto1,
          t.impuesto2,
          t.impuesto3,
          t.business_location_id,
          t.type,
          t.activo,
          t.id_dueno_anterior,
          t.id_dueno_nuevo,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE
        ORDER BY 
          t.fecha_documento DESC
      `
      return result.rows
    }
  } catch (error) {
    console.error("Error al obtener transacciones:", error)
    return []
  }
}

// También necesitamos corregir la función getTransactionById
export async function getTransactionById(id) {
  try {
    // Obtener la transacción
    const transactionResult = await sql`
      SELECT 
        t.id,
        t.numero_documento,
        LPAD(EXTRACT(DAY FROM t.fecha_documento)::text, 2, '0') || '/' || 
        LPAD(EXTRACT(MONTH FROM t.fecha_documento)::text, 2, '0') || '/' || 
        EXTRACT(YEAR FROM t.fecha_documento)::text as fecha_documento,
        t.estado,
        t.total,
        t.quantity_m,
        t.quantity_h,
        t.quantity_k,
        t.impuesto1,
        t.impuesto2,
        t.impuesto3,
        t.business_location_id,
        t.type,
        t.activo,
        t.id_dueno_anterior,
        t.id_dueno_nuevo,
        ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
        cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre
      FROM 
        transactions t
        LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
        LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
      WHERE 
        t.id = ${id}
    `

    if (transactionResult.rows.length === 0) {
      return null
    }

    const transaction = transactionResult.rows[0]

    // Obtener las líneas de la transacción
    const linesResult = await sql`
      SELECT * FROM transaction_lines WHERE transaction_id = ${id}
    `

    transaction.transaction_lines = linesResult.rows

    return transaction
  } catch (error) {
    console.error(`Error al obtener transacción con ID ${id}:`, error)
    return null
  }
}

// Función para obtener departamentos
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

// Función para obtener municipios por departamento
export async function getMunicipiosByDepartamento(departamentoId: number) {
  try {
    console.log(`Obteniendo municipios para departamento ID: ${departamentoId}`)

    if (!departamentoId || isNaN(departamentoId)) {
      console.error(`ID de departamento inválido: ${departamentoId}`)
      return []
    }

    // Verificar si la tabla municipios existe
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'municipios'
      ) as exists
    `

    if (!tableCheck.rows[0].exists) {
      console.error("La tabla municipios no existe en la base de datos")
      return []
    }

    // Verificar la estructura de la tabla municipios
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'municipios'
    `

    console.log(
      "Columnas en tabla municipios:",
      columnCheck.rows.map((r) => r.column_name),
    )

    // Verificar si hay municipios para este departamento
    const countCheck = await sql`
      SELECT COUNT(*) as count 
      FROM municipios 
      WHERE id_departamento = ${departamentoId}
    `

    console.log(`Número de municipios encontrados para departamento ${departamentoId}: ${countCheck.rows[0].count}`)

    // Realizar la consulta principal
    const result = await sql`
      SELECT id, name as nombre, cod_dian 
      FROM municipios 
      WHERE id_departamento = ${departamentoId} AND activo = TRUE
      ORDER BY name
    `

    console.log(`Municipios encontrados: ${result.rows.length}`)
    return result.rows
  } catch (error) {
    console.error(`Error al obtener municipios para departamento ${departamentoId}:`, error)
    return []
  }
}

// Función para obtener ubicaciones de un contacto
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

// Función para obtener impuestos
export async function getTaxes() {
  noStore()
  try {
    const data = await sql`
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
    return data.rows
  } catch (error) {
    console.error("Error al obtener impuestos:", error)
    return []
  }
}

export async function getTaxById(id: string) {
  noStore()
  try {
    const data = await sql`
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
    return data.rows[0]
  } catch (error) {
    console.error("Error al obtener impuesto:", error)
    return null
  }
}

// Función corregida para obtener impuestos por tipo
export async function getTaxesByLocationType(tipo: string) {
  noStore()
  try {
    // Mapear el tipo a un location_id
    let locationId
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    } else {
      console.error(`Tipo de ubicación inválido: ${tipo}`)
      return []
    }

    // Consultar los impuestos para esta ubicación
    const data = await sql`
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

    console.log(`Impuestos encontrados para tipo ${tipo} (location_id=${locationId}): ${data.rows.length}`)
    return data.rows
  } catch (error) {
    console.error("Error al obtener impuestos por tipo:", error)
    return []
  }
}

// Función para obtener datos financieros
export async function getFinancialData() {
  // Mantenemos noStore() para asegurar datos frescos
  noStore()
  try {
    // Obtener todas las transacciones con sus impuestos
    const transactionsResult = await sql`
      SELECT 
        id,
        type,
        TO_CHAR(fecha_documento, 'DD/MM/YYYY') as fecha_documento,
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
      transactions: transactionsResult.rows || [],
      monthlyStats: (monthlyStatsResult.rows || []).map((row) => ({
        ...row,
        mes: row.mes ? row.mes.toISOString().split("T")[0].substring(0, 7) : "", // Formato YYYY-MM
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

// Nueva función para obtener consignantes por location_id
export async function getConsignantesByLocationId(locationId: number) {
  noStore()
  try {
    console.log(`Obteniendo consignantes para location_id ${locationId}`)

    // Verificar si la tabla consignantes existe
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consignantes'
      ) as exists
    `

    if (!tableCheck.rows[0].exists) {
      console.error("La tabla consignantes no existe en la base de datos")
      return []
    }

    const result = await sql`
      SELECT id, nombre
      FROM consignantes
      WHERE location_id = ${locationId} AND activo = TRUE
      ORDER BY nombre
    `
    console.log(`Consignantes encontrados: ${result.rows.length}`)
    return result.rows
  } catch (error) {
    console.error(`Error al obtener consignantes para location_id ${locationId}:`, error)
    return []
  }
}
