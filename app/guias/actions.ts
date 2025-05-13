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
}

// Función para crear una nueva guía
export async function createGuia(data: GuiaData) {
  try {
    console.log("Iniciando creación de guía:", data)

    // Iniciar una transacción
    await sql`BEGIN`

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
        ${data.fecha_documento},
        ${data.id_dueno_anterior},
        ${data.id_dueno_nuevo},
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

    // Insertar las líneas de la transacción (sin el campo es_macho)
    for (const linea of data.lineas) {
      // Asegurarse de que raza_id y color_id sean valores válidos (no nulos)
      // Si son nulos, usar valores predeterminados según el tipo de animal
      const raza_id = linea.raza_id || 1 // Usar un valor predeterminado si es nulo
      const color_id = linea.color_id || 1 // Usar un valor predeterminado si es nulo

      // No establecemos ticket2 aquí, dejamos que el trigger lo haga automáticamente
      await sql`
        INSERT INTO transaction_lines (
          transaction_id,
          ticket,
          product_id,
          quantity,
          raza_id,
          color_id,
          valor
        ) VALUES (
          ${transactionId},
          ${linea.ticket},
          ${linea.product_id},
          ${linea.quantity},
          ${raza_id},
          ${color_id},
          ${linea.valor}
        )
      `
    }

    // Obtener las líneas con sus ticket2 generados
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
      lines: linesResult.rows,
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
export async function updateGuia(id: number, data: GuiaData) {
  try {
    console.log(`Iniciando actualización de guía ID: ${id}`, data)

    // Iniciar una transacción
    await sql`BEGIN`

    // Actualizar la transacción (encabezado de la guía)
    await sql`
      UPDATE transactions 
      SET 
        numero_documento = ${data.numero_documento},
        fecha_documento = ${data.fecha_documento},
        id_dueno_anterior = ${data.id_dueno_anterior},
        id_dueno_nuevo = ${data.id_dueno_nuevo},
        business_location_id = ${data.business_location_id},
        total = ${data.total},
        estado = ${data.estado},
        type = ${data.type},
        usuario_id = ${data.usuario_id},
        quantity_m = ${data.quantity_m || 0},
        quantity_h = ${data.quantity_h || 0},
        quantity_k = ${data.quantity_k || 0},
        ubication_contact_id = ${data.ubication_contact_id || null},
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    // Eliminar las líneas existentes
    await sql`DELETE FROM transaction_lines WHERE transaction_id = ${id}`

    // Insertar las nuevas líneas (sin el campo es_macho)
    for (const linea of data.lineas) {
      // Asegurarse de que raza_id y color_id sean valores válidos (no nulos)
      const raza_id = linea.raza_id || 1 // Usar un valor predeterminado si es nulo
      const color_id = linea.color_id || 1 // Usar un valor predeterminado si es nulo

      // No establecemos ticket2 aquí, dejamos que el trigger lo haga automáticamente
      await sql`
        INSERT INTO transaction_lines (
          transaction_id,
          ticket,
          product_id,
          quantity,
          raza_id,
          color_id,
          valor
        ) VALUES (
          ${id},
          ${linea.ticket},
          ${linea.product_id},
          ${linea.quantity},
          ${raza_id},
          ${color_id},
          ${linea.valor}
        )
      `
    }

    // Obtener las líneas con sus ticket2 generados
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
      lines: linesResult.rows,
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
