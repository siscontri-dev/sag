import { sql } from "@vercel/postgres"

// Función para obtener datos de reportes
export async function getReportData() {
  try {
    // Obtener datos de guías
    const guiasResult = await sql`
      SELECT 
        t.*,
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
        SUM(CASE WHEN t.tipo_animal = 'bovino' THEN tl.quantity ELSE 0 END) as bovinos_kilos,
        SUM(CASE WHEN t.tipo_animal = 'porcino' THEN tl.quantity ELSE 0 END) as porcinos_kilos,
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

    return {
      guias: guiasResult.rows,
      sacrificios: sacrificiosResult.rows,
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
      contactCount: Number.parseInt(contactsResult.rows[0].count) || 0,
      guiasCount: Number.parseInt(guiasResult.rows[0].count) || 0,
      sacrificiosCount: Number.parseInt(sacrificiosResult.rows[0].count) || 0,
      totalKilos: Number.parseFloat(kilosResult.rows[0]?.total || "0"),
      recentTransactions: recentTransactionsResult.rows || [],
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return {
      contactCount: 0,
      guiasCount: 0,
      sacrificiosCount: 0,
      totalKilos: 0,
      recentTransactions: [],
    }
  }
}

// Función para obtener contactos
export async function getContacts() {
  try {
    const result = await sql`
      SELECT * FROM contacts WHERE activo = TRUE ORDER BY primer_nombre, primer_apellido
    `
    return result.rows
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

// Función para obtener productos
export async function getProducts(tipo = undefined) {
  try {
    if (tipo) {
      const result = await sql`
        SELECT * FROM products 
        WHERE activo = TRUE AND tipo_animal = ${tipo}
        ORDER BY nombre
      `
      return result.rows
    } else {
      const result = await sql`
        SELECT * FROM products WHERE activo = TRUE ORDER BY nombre
      `
      return result.rows
    }
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

// Función para obtener transacciones
export async function getTransactions(type = undefined, tipoAnimal = undefined) {
  try {
    if (type && tipoAnimal) {
      const result = await sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = ${type} AND t.tipo_animal = ${tipoAnimal}
        ORDER BY 
          t.fecha_documento DESC
      `
      return result.rows
    } else if (type) {
      const result = await sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre
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
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre
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

// Función para obtener una transacción por ID
export async function getTransactionById(id) {
  try {
    // Obtener la transacción
    const transactionResult = await sql`
      SELECT 
        t.*,
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
    const result = await sql`
      SELECT id, name as nombre, cod_dian FROM municipios 
      WHERE id_departamento = ${departamentoId} AND activo = TRUE
      ORDER BY name
    `
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
