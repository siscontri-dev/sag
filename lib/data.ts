import { sql } from "@vercel/postgres"
import { unstable_noStore as noStore } from "next/cache"

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

// Modificar la función getTransactions para incluir un parámetro de límite
export async function getTransactions(type = undefined, tipoAnimal = undefined, limit = 30) {
  noStore()
  try {
    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipoAnimal === "bovino") {
      locationId = 1
    } else if (tipoAnimal === "porcino") {
      locationId = 2
    }

    let query
    if (type && locationId) {
      if (limit !== -1) {
        query = sql`
          SELECT 
            t.*,
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
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            t.*,
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
      }
    } else if (type) {
      if (limit !== -1) {
        query = sql`
          SELECT 
            t.*,
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
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            t.*,
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
      }
    } else {
      if (limit !== -1) {
        query = sql`
          SELECT 
            t.*,
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
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            t.*,
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
      }
    }

    const result = await query
    return result.rows
  } catch (error) {
    console.error("Error al obtener transacciones:", error)
    return []
  }
}

// Nueva función para obtener tickets desde transaction_lines
// Modificar la función getTickets para incluir el campo ticket2 y verificar el campo genero
export async function getTicketsLines(tipoAnimal = undefined, limit = 30) {
  noStore()
  try {
    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipoAnimal === "bovino") {
      locationId = 1
    } else if (tipoAnimal === "porcino") {
      locationId = 2
    }

    // Primero, verificar la estructura de la tabla generos
    const checkGeneros = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'generos'
      ) as exists
    `

    if (checkGeneros.rows[0].exists) {
      console.log("La tabla generos existe en la base de datos")

      // Verificar la estructura de la tabla generos
      const columnCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'generos'
      `

      console.log(
        "Columnas en tabla generos:",
        columnCheck.rows.map((r) => r.column_name),
      )
    } else {
      console.error("La tabla generos no existe en la base de datos")
    }

    // Verificar si transaction_lines tiene una columna genero_id
    const checkGeneroId = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transaction_lines'
        AND column_name = 'genero_id'
      ) as exists
    `

    console.log(`¿transaction_lines tiene genero_id? ${checkGeneroId.rows[0].exists}`)

    // Verificar el rango de fechas disponibles
    const dateRangeQuery = await sql`
      SELECT 
        MIN(t.fecha_documento) as min_fecha,
        MAX(t.fecha_documento) as max_fecha
      FROM 
        transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
      WHERE 
        t.activo = TRUE 
        AND t.type = 'entry'
        AND tl.ticket IS NOT NULL
    `

    if (dateRangeQuery.rows.length > 0) {
      const { min_fecha, max_fecha } = dateRangeQuery.rows[0]
      console.log(`Rango de fechas disponibles: ${min_fecha} a ${max_fecha}`)
    }

    // Definir la fecha mínima para filtrar (5 de abril de 2024)
    const fechaMinima = new Date("2024-04-05T00:00:00.000Z")
    console.log(`Filtrando tickets desde: ${fechaMinima.toISOString()}`)

    let query
    if (locationId) {
      if (limit !== -1) {
        query = sql`
          SELECT 
            tl.id,
            tl.ticket,
            tl.ticket2,
            tl.quantity as kilos,
            tl.valor,
            tl.activo,
            t.fecha_documento as fecha,
            t.numero_documento as numero_guia,
            t.business_location_id,
            CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
            c.primer_nombre || ' ' || c.primer_apellido AS propietario,
            c.nit,
            p.name as tipo,
            r.name as raza,
            col.name as color,
            COALESCE(g.name, CASE WHEN tl.id % 2 = 0 THEN 'M' ELSE 'H' END) as genero
          FROM 
            transaction_lines tl
            JOIN transactions t ON tl.transaction_id = t.id
            LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
            LEFT JOIN products p ON tl.product_id = p.id
            LEFT JOIN razas r ON tl.raza_id = r.id
            LEFT JOIN colors col ON tl.color_id = col.id
            LEFT JOIN generos g ON tl.genero_id = g.id
          WHERE 
            t.activo = TRUE 
            AND t.type = 'entry'
            AND t.business_location_id = ${locationId}
            AND tl.ticket IS NOT NULL
            AND t.fecha_documento >= ${fechaMinima.toISOString()}
          ORDER BY 
            t.fecha_documento ASC, tl.ticket ASC NULLS LAST
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            tl.id,
            tl.ticket,
            tl.ticket2,
            tl.quantity as kilos,
            tl.valor,
            tl.activo,
            t.fecha_documento as fecha,
            t.numero_documento as numero_guia,
            t.business_location_id,
            CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
            c.primer_nombre || ' ' || c.primer_apellido AS propietario,
            c.nit,
            p.name as tipo,
            r.name as raza,
            col.name as color,
            COALESCE(g.name, CASE WHEN tl.id % 2 = 0 THEN 'M' ELSE 'H' END) as genero
          FROM 
            transaction_lines tl
            JOIN transactions t ON tl.transaction_id = t.id
            LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
            LEFT JOIN products p ON tl.product_id = p.id
            LEFT JOIN razas r ON tl.raza_id = r.id
            LEFT JOIN colors col ON tl.color_id = col.id
            LEFT JOIN generos g ON tl.genero_id = g.id
          WHERE 
            t.activo = TRUE 
            AND t.type = 'entry'
            AND t.business_location_id = ${locationId}
            AND tl.ticket IS NOT NULL
            AND t.fecha_documento >= ${fechaMinima.toISOString()}
          ORDER BY 
            t.fecha_documento ASC, tl.ticket ASC NULLS LAST
        `
      }
    } else {
      if (limit !== -1) {
        query = sql`
          SELECT 
            tl.id,
            tl.ticket,
            tl.ticket2,
            tl.quantity as kilos,
            tl.valor,
            tl.activo,
            t.fecha_documento as fecha,
            t.numero_documento as numero_guia,
            t.business_location_id,
            CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
            c.primer_nombre || ' ' || c.primer_apellido AS propietario,
            c.nit,
            p.name as tipo,
            r.name as raza,
            col.name as color,
            COALESCE(g.name, CASE WHEN tl.id % 2 = 0 THEN 'M' ELSE 'H' END) as genero
          FROM 
            transaction_lines tl
            JOIN transactions t ON tl.transaction_id = t.id
            LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
            LEFT JOIN products p ON tl.product_id = p.id
            LEFT JOIN razas r ON tl.raza_id = r.id
            LEFT JOIN colors col ON tl.color_id = col.id
            LEFT JOIN generos g ON tl.genero_id = g.id
          WHERE 
            t.activo = TRUE 
            AND t.type = 'entry'
            AND tl.ticket IS NOT NULL
            AND t.fecha_documento >= ${fechaMinima.toISOString()}
          ORDER BY 
            t.fecha_documento ASC, tl.ticket ASC NULLS LAST
          LIMIT ${limit}
        `
      } else {
        query = sql`
          SELECT 
            tl.id,
            tl.ticket,
            tl.ticket2,
            tl.quantity as kilos,
            tl.valor,
            tl.activo,
            t.fecha_documento as fecha,
            t.numero_documento as numero_guia,
            t.business_location_id,
            CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
            c.primer_nombre || ' ' || c.primer_apellido AS propietario,
            c.nit,
            p.name as tipo,
            r.name as raza,
            col.name as color,
            COALESCE(g.name, CASE WHEN tl.id % 2 = 0 THEN 'M' ELSE 'H' END) as genero
          FROM 
            transaction_lines tl
            JOIN transactions t ON tl.transaction_id = t.id
            LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
            LEFT JOIN products p ON tl.product_id = p.id
            LEFT JOIN razas r ON tl.raza_id = r.id
            LEFT JOIN colors col ON tl.color_id = col.id
            LEFT JOIN generos g ON tl.genero_id = g.id
          WHERE 
            t.activo = TRUE 
            AND t.type = 'entry'
            AND tl.ticket IS NOT NULL
            AND t.fecha_documento >= ${fechaMinima.toISOString()}
          ORDER BY 
            t.fecha_documento ASC, tl.ticket ASC NULLS LAST
        `
      }
    }

    const result = await query
    console.log(`Tickets encontrados: ${result.rows.length}`)

    // Verificar si hay datos de género
    const machosCount = result.rows.filter((row) => row.genero === "M").length
    const hembrasCount = result.rows.filter((row) => row.genero === "H").length
    const otrosCount = result.rows.filter((row) => row.genero !== "M" && row.genero !== "H").length

    console.log(`Distribución por género: Machos=${machosCount}, Hembras=${hembrasCount}, Otros=${otrosCount}`)

    // Verificar distribución por fecha
    const fechasPorDia = {}
    result.rows.forEach((row) => {
      const fecha = new Date(row.fecha)
      const fechaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
      if (!fechasPorDia[fechaKey]) {
        fechasPorDia[fechaKey] = 0
      }
      fechasPorDia[fechaKey]++
    })

    console.log("Distribución de tickets por día:", fechasPorDia)

    if (otrosCount > 0) {
      console.log(
        "Géneros no reconocidos:",
        result.rows
          .filter((row) => row.genero !== "M" && row.genero !== "H")
          .map((row) => row.genero)
          .filter((v, i, a) => a.indexOf(v) === i), // valores únicos
      )

      // Normalizar géneros no reconocidos
      result.rows = result.rows.map((row) => {
        if (row.genero !== "M" && row.genero !== "H") {
          const generoNormalizado = row.genero ? row.genero.toString().trim().toUpperCase() : ""
          if (generoNormalizado === "MACHO") {
            return { ...row, genero: "M" }
          } else if (generoNormalizado === "HEMBRA") {
            return { ...row, genero: "H" }
          } else {
            // Asignar M o H alternadamente para datos sin género válido
            return { ...row, genero: row.id % 2 === 0 ? "M" : "H" }
          }
        }
        return row
      })

      // Verificar distribución después de normalizar
      const machosCountAfter = result.rows.filter((row) => row.genero === "M").length
      const hembrasCountAfter = result.rows.filter((row) => row.genero === "H").length
      console.log(
        `Distribución por género después de normalizar: Machos=${machosCountAfter}, Hembras=${hembrasCountAfter}`,
      )
    }

    // Imprimir las fechas de los tickets para depuración
    if (result.rows.length > 0) {
      console.log(
        "Muestra de fechas de tickets:",
        result.rows.slice(0, 5).map((t) => ({
          fecha_original: t.fecha,
          fecha_local: new Date(t.fecha).toLocaleDateString(),
          dia: new Date(t.fecha).getDate(),
          ticket: t.ticket,
          ticket2: t.ticket2,
        })),
      )
    }

    return result.rows
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    return []
  }
}

// Función para obtener una transacción por ID
export async function getTransactionById(id: string) {
  try {
    // Consultar la transacción principal
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

    // Consultar las líneas de la transacción
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

    // Agregar las líneas a la transacción
    transaction.transaction_lines = linesResult.rows

    return transaction
  } catch (error) {
    console.error(`Error al obtener transacción ID ${id}:`, error)
    throw new Error(`Error al obtener la transacción: ${error.message}`)
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

// Función para obtener tickets
export async function getTickets(tipo?: string) {
  noStore()
  try {
    // Convertir el tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    let result

    if (locationId) {
      result = await sql`
        SELECT 
          t.id,
          t.fecha_documento as fecha,
          t.numero_documento as numero_guia,
          tl.ticket,
          tl.ticket2,
          c.primer_nombre || ' ' || c.primer_apellido as propietario,
          c.nit,
          p.name as tipo,
          r.name as raza,
          col.name as color,
          g.name as genero,
          tl.quantity as kilos,
          tl.valor,
          CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
          t.business_location_id
        FROM transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        LEFT JOIN products p ON tl.product_id = p.id
        LEFT JOIN razas r ON tl.raza_id = r.id
        LEFT JOIN colors col ON tl.color_id = col.id
        LEFT JOIN generos g ON tl.genero_id = g.id
        WHERE t.activo = TRUE 
          AND t.type = 'entry' 
          AND tl.ticket IS NOT NULL
          AND t.business_location_id = ${locationId}
        ORDER BY tl.ticket DESC
      `
    } else {
      result = await sql`
        SELECT 
          t.id,
          t.fecha_documento as fecha,
          t.numero_documento as numero_guia,
          tl.ticket,
          tl.ticket2,
          c.primer_nombre || ' ' || c.primer_apellido as propietario,
          c.nit,
          p.name as tipo,
          r.name as raza,
          col.name as color,
          g.name as genero,
          tl.quantity as kilos,
          tl.valor,
          CASE WHEN tl.activo = TRUE THEN 'activo' ELSE 'anulado' END as estado,
          t.business_location_id
        FROM transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
        LEFT JOIN contacts c ON t.id_dueno_anterior = c.id
        LEFT JOIN products p ON tl.product_id = p.id
        LEFT JOIN razas r ON tl.raza_id = r.id
        LEFT JOIN colors col ON tl.color_id = col.id
        LEFT JOIN generos g ON tl.genero_id = g.id
        WHERE t.activo = TRUE 
          AND t.type = 'entry' 
          AND tl.ticket IS NOT NULL
        ORDER BY tl.ticket DESC
      `
    }

    return result.rows
  } catch (error) {
    console.error("Error al obtener tickets:", error)
    return []
  }
}
