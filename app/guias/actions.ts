"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"

// Tipo para los datos de la guía
interface GuiaData {
  numero_documento: string
  fecha_documento: string
  id_dueno_anterior: number
  id_dueno_nuevo: number
  business_location_id: number
  total: number
  estado: string
  type: string
  usuario_id: number
  quantity_m: number
  quantity_h: number
  quantity_k: number
  ubication_contact_id: number // Nuevo campo para la ubicación
  lineas: LineaData[]
}

// Tipo para los datos de una línea
interface LineaData {
  ticket: number
  product_id: number
  quantity: number
  raza_id: number | null
  color_id: number | null
  valor: number
  es_macho?: boolean
  genero_id?: number
}

// Función para obtener el siguiente número de ticket2
async function getNextTicket2(locationId: number): Promise<number> {
  try {
    // Obtener el primer día del mes actual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthStr = firstDayOfMonth.toISOString()

    // Buscar el último ticket2 en transaction_lines para esta ubicación y mes actual
    const result = await sql`
      SELECT MAX(tl.ticket2) as last_ticket2
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.business_location_id = ${locationId}
        AND t.activo = TRUE
        AND t.fecha_creacion >= ${firstDayOfMonthStr}
    `

    let nextTicket2 = 1

    if (result.rows.length > 0 && result.rows[0].last_ticket2) {
      nextTicket2 = Number(result.rows[0].last_ticket2) + 1
    }

    console.log(`Siguiente ticket2 para location_id ${locationId}: ${nextTicket2}`)
    return nextTicket2
  } catch (error) {
    console.error("Error al obtener siguiente ticket2:", error)
    return 1 // Valor por defecto en caso de error
  }
}

// Función para crear una nueva guía
export async function createGuia(data: GuiaData) {
  try {
    console.log("Iniciando creación de guía:", data)

    // Validar que id_dueno_anterior sea un valor válido
    if (!data.id_dueno_anterior) {
      return {
        success: false,
        message: "Error: El propietario (id_dueno_anterior) es requerido",
      }
    }

    // Iniciar una transacción
    await sql`BEGIN`

    // Verificar si el contacto existe
    const contactCheck = await sql`
      SELECT id FROM contacts WHERE id = ${data.id_dueno_anterior} AND activo = TRUE
    `

    if (contactCheck.rows.length === 0) {
      await sql`ROLLBACK`
      return {
        success: false,
        message: `Error: El propietario con ID ${data.id_dueno_anterior} no existe o no está activo`,
      }
    }

    // Usar la fecha exacta del formulario sin modificarla
    // Esto evita que se cambie al día siguiente
    const fechaDocumento = data.fecha_documento

    // Insertar la transacción (encabezado de la guía)
    const transactionResult = await sql`
      INSERT INTO transactions (
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        business_location_id,
        total,
        estado,
        type,
        usuario_id,
        quantity_m,
        quantity_h,
        quantity_k,
        ubication_contact_id
      ) VALUES (
        ${data.numero_documento},
        ${fechaDocumento},
        ${data.id_dueno_anterior},
        ${data.id_dueno_nuevo || null},
        ${data.business_location_id},
        ${data.total},
        ${data.estado},
        ${data.type},
        ${data.usuario_id},
        ${data.quantity_m || 0},
        ${data.quantity_h || 0},
        ${data.quantity_k || 0},
        ${data.ubication_contact_id || null}
      )
      RETURNING id
    `

    if (transactionResult.rows.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Error al crear la guía: no se pudo obtener el ID de la transacción" }
    }

    const transactionId = transactionResult.rows[0].id

    // Obtener el siguiente número de ticket2 para esta ubicación
    const nextTicket2 = await getNextTicket2(data.business_location_id)
    let currentTicket2 = nextTicket2

    // Insertar las líneas de la transacción
    for (const linea of data.lineas) {
      // Asegurarse de que raza_id y color_id sean valores válidos (no nulos)
      // Si son nulos, usar valores predeterminados según el tipo de animal
      const raza_id = linea.raza_id || 1 // Usar un valor predeterminado si es nulo
      const color_id = linea.color_id || 1 // Usar un valor predeterminado si es nulo

      // Asegurarse de que genero_id sea un valor válido (no nulo)
      const genero_id = linea.genero_id || (linea.es_macho ? 1 : 2) // Usar 1 (macho) o 2 (hembra) según es_macho

      console.log(`Insertando línea con ticket: ${linea.ticket}, ticket2: ${currentTicket2}, genero_id: ${genero_id}`)

      // IMPORTANTE: Desactivar temporalmente el trigger para esta inserción
      await sql`ALTER TABLE transaction_lines DISABLE TRIGGER tr_generate_monthly_ticket;`

      // Insertar con los valores exactos proporcionados para ticket
      // y el valor consecutivo para ticket2
      await sql`
        INSERT INTO transaction_lines (
          transaction_id,
          ticket,
          ticket2,
          product_id,
          quantity,
          raza_id,
          color_id,
          valor,
          genero_id
        ) VALUES (
          ${transactionId},
          ${linea.ticket},
          ${currentTicket2},
          ${linea.product_id},
          ${linea.quantity},
          ${raza_id},
          ${color_id},
          ${linea.valor},
          ${genero_id}
        )
      `

      // Volver a activar el trigger después de la inserción
      await sql`ALTER TABLE transaction_lines ENABLE TRIGGER tr_generate_monthly_ticket;`

      // Incrementar el contador de ticket2 para la siguiente línea
      currentTicket2++
    }

    // Verificar que los valores de ticket se hayan guardado correctamente
    const linesResult = await sql`
      SELECT * FROM transaction_lines WHERE transaction_id = ${transactionId}
    `

    // Confirmar la transacción
    await sql`COMMIT`

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/guias")

    return {
      success: true,
      message: "Guía creada correctamente",
      transactionId,
      lines: linesResult.rows.map((line) => ({
        ...line,
        ticket: line.ticket,
        ticket2: line.ticket2,
      })),
    }
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error("Error al crear guía:", error)
    return {
      success: false,
      message: `Error al crear la guía: ${error.message || "Error desconocido"}`,
    }
  }
}

// Función para actualizar una guía existente
export async function updateGuia(id: number, data: any) {
  try {
    console.log("Actualizando guía:", id, data)

    // Validar datos requeridos
    if (!data.id_dueno_anterior) {
      return { success: false, message: "El propietario es requerido" }
    }

    if (!data.numero_documento) {
      return { success: false, message: "El número de documento es requerido" }
    }

    if (!data.fecha_documento) {
      return { success: false, message: "La fecha del documento es requerida" }
    }

    if (!data.lineas || data.lineas.length === 0) {
      return { success: false, message: "Debe agregar al menos una línea a la guía" }
    }

    // Verificar que el contacto exista
    const contactCheck = await sql`
      SELECT id FROM contacts WHERE id = ${data.id_dueno_anterior} AND activo = TRUE
    `

    if (contactCheck.rows.length === 0) {
      return {
        success: false,
        message: `Error: El propietario con ID ${data.id_dueno_anterior} no existe o no está activo`,
      }
    }

    // Verificar que la ubicación exista si se proporciona
    if (data.ubication_contact_id) {
      const ubicationCheck = await sql`
        SELECT id FROM ubication_contact WHERE id = ${data.ubication_contact_id} AND id_contact = ${data.id_dueno_anterior}
      `

      if (ubicationCheck.rows.length === 0) {
        return { success: false, message: "La ubicación seleccionada no existe o no pertenece al propietario" }
      }
    }

    // Iniciar una transacción
    await sql`BEGIN`

    // Usar la fecha exacta del formulario sin modificarla
    // Esto evita que se cambie al día siguiente
    const fechaDocumento = data.fecha_documento

    // Calcular los totales basados en las líneas actuales
    let totalMachos = 0
    let totalHembras = 0
    let totalKilos = 0
    let totalValor = 0

    // Recalcular los totales basados en las líneas actuales
    for (const linea of data.lineas) {
      const generoId = linea.genero_id !== undefined ? Number(linea.genero_id) : linea.es_macho ? 1 : 2
      const kilos = Number(linea.quantity || 0)
      const valor = Number(linea.valor || 0)

      if (generoId === 1) {
        // Macho
        totalMachos += 1
      } else if (generoId === 2) {
        // Hembra
        totalHembras += 1
      }

      totalKilos += kilos
      totalValor += valor
    }

    console.log("Totales recalculados:", {
      totalMachos,
      totalHembras,
      totalKilos,
      totalValor,
    })

    // Actualizar la transacción (encabezado de la guía) con los totales recalculados
    await sql`
      UPDATE transactions 
      SET 
        numero_documento = ${data.numero_documento},
        fecha_documento = ${fechaDocumento},
        id_dueno_anterior = ${data.id_dueno_anterior},
        id_dueno_nuevo = ${null}, -- Ya no se usa, siempre null
        business_location_id = ${data.business_location_id},
        total = ${totalValor},
        estado = ${data.estado},
        type = ${data.type},
        usuario_id = ${data.usuario_id},
        quantity_m = ${totalMachos},
        quantity_h = ${totalHembras},
        quantity_k = ${totalKilos},
        ubication_contact_id = ${data.ubication_contact_id || null},
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Obtener los valores actuales de ticket2 para preservarlos
    const existingLines = await sql`
      SELECT id, ticket, ticket2 FROM transaction_lines WHERE transaction_id = ${id}
    `

    console.log("Líneas existentes:", existingLines.rows)

    // Crear un mapa de ticket -> ticket2 para preservar los valores
    const ticket2Map = new Map()
    existingLines.rows.forEach((row) => {
      ticket2Map.set(Number(row.ticket), Number(row.ticket2))
    })

    // Obtener todos los ticket2 existentes para esta ubicación y mes actual
    // para evitar duplicados
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfMonthStr = firstDayOfMonth.toISOString()

    const existingTicket2Result = await sql`
      SELECT tl.ticket2
      FROM transaction_lines tl
      JOIN transactions t ON tl.transaction_id = t.id
      WHERE t.business_location_id = ${data.business_location_id}
        AND t.activo = TRUE
        AND t.fecha_creacion >= ${firstDayOfMonthStr}
        AND t.id != ${id}
      ORDER BY tl.ticket2
    `

    // Crear un conjunto de ticket2 existentes para verificar duplicados
    const existingTicket2Set = new Set(existingTicket2Result.rows.map((row) => Number(row.ticket2)))
    console.log("Ticket2 existentes en otras transacciones:", Array.from(existingTicket2Set))

    // Obtener el siguiente número de ticket2 para esta ubicación
    const nextTicket2 = await getNextTicket2(data.business_location_id)
    let currentTicket2 = nextTicket2

    // Eliminar las líneas existentes
    await sql`DELETE FROM transaction_lines WHERE transaction_id = ${id}`

    // Insertar las nuevas líneas
    for (const linea of data.lineas) {
      // Asegurarse de que raza_id y color_id sean valores válidos (no nulos)
      const raza_id = linea.raza_id || 1 // Usar un valor predeterminado si es nulo
      const color_id = linea.color_id || 1 // Usar un valor predeterminado si es nulo

      // Asegurarse de que genero_id sea un valor válido (no nulo)
      // Si genero_id viene explícitamente, usarlo; si no, determinarlo por es_macho
      const genero_id = linea.genero_id !== undefined ? Number(linea.genero_id) : linea.es_macho ? 1 : 2

      // Intentar preservar el ticket2 original si existe
      let preservedTicket2 = ticket2Map.get(Number(linea.ticket))

      // Si el ticket2 preservado ya existe en otra transacción, no lo usamos
      if (preservedTicket2 && existingTicket2Set.has(preservedTicket2)) {
        console.log(`Ticket2 ${preservedTicket2} ya existe en otra transacción, generando uno nuevo`)
        preservedTicket2 = null
      }

      // Si no hay ticket2 preservado o no es válido, usar uno nuevo
      let finalTicket2 = preservedTicket2 || currentTicket2

      // Asegurarse de que el ticket2 no esté duplicado
      while (existingTicket2Set.has(finalTicket2)) {
        finalTicket2++
      }

      console.log(`Actualizando línea con ticket: ${linea.ticket}, ticket2: ${finalTicket2}, genero_id: ${genero_id}`)

      // IMPORTANTE: Desactivar temporalmente el trigger para esta inserción
      await sql`ALTER TABLE transaction_lines DISABLE TRIGGER tr_generate_monthly_ticket;`

      // Insertar con los valores exactos proporcionados para ticket
      // y preservar ticket2 si es posible, o usar uno nuevo
      await sql`
        INSERT INTO transaction_lines (
          transaction_id,
          ticket,
          ticket2,
          product_id,
          quantity,
          raza_id,
          color_id,
          valor,
          genero_id
        ) VALUES (
          ${id},
          ${Number(linea.ticket)},
          ${finalTicket2},
          ${Number(linea.product_id)},
          ${Number(linea.quantity)},
          ${raza_id},
          ${color_id},
          ${Number(linea.valor)},
          ${genero_id}
        )
      `

      // Volver a activar el trigger después de la inserción
      await sql`ALTER TABLE transaction_lines ENABLE TRIGGER tr_generate_monthly_ticket;`

      // Agregar este ticket2 al conjunto para evitar duplicados en las siguientes líneas
      existingTicket2Set.add(finalTicket2)

      // Solo incrementar si usamos un nuevo ticket2
      if (!preservedTicket2) {
        currentTicket2 = finalTicket2 + 1
      }
    }

    // Verificar que los valores de ticket se hayan guardado correctamente
    const linesResult = await sql`
      SELECT * FROM transaction_lines WHERE transaction_id = ${id}
    `

    // Confirmar la transacción
    await sql`COMMIT`

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/guias")
    revalidatePath(`/guias/editar/${id}`)
    revalidatePath(`/guias/ver/${id}`)

    return {
      success: true,
      message: "Guía actualizada correctamente",
      transactionId: id,
      lines: linesResult.rows.map((line) => ({
        ...line,
        ticket: line.ticket,
        ticket2: line.ticket2,
      })),
    }
  } catch (error) {
    // Revertir la transacción en caso de error
    await sql`ROLLBACK`
    console.error(`Error al actualizar guía ID ${id}:`, error)
    return {
      success: false,
      message: `Error al actualizar la guía: ${error.message || "Error desconocido"}`,
    }
  }
}

// Función para cambiar el estado de una guía
export async function changeGuiaStatus(id: number, estado: string) {
  try {
    await sql`
      UPDATE transactions 
      SET 
        estado = ${estado},
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/guias")
    revalidatePath(`/guias/ver/${id}`)

    return {
      success: true,
      message: `Estado de la guía cambiado a ${estado} correctamente`,
    }
  } catch (error) {
    console.error(`Error al cambiar estado de guía ID ${id}:`, error)
    return {
      success: false,
      message: `Error al cambiar el estado de la guía: ${error.message || "Error desconocido"}`,
    }
  }
}

// Función para eliminar una guía (marcar como inactiva)
export async function deleteGuia(id: number) {
  try {
    // Marcar como inactiva en lugar de eliminar físicamente
    await sql`
      UPDATE transactions 
      SET 
        activo = FALSE,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/guias")

    return {
      success: true,
      message: "Guía eliminada correctamente",
    }
  } catch (error) {
    console.error(`Error al eliminar guía ID ${id}:`, error)
    return {
      success: false,
      message: `Error al eliminar la guía: ${error.message || "Error desconocido"}`,
    }
  }
}
