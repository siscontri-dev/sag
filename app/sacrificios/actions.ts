"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"

// Actualizar la función createSacrificio para incluir los nuevos campos
export async function createSacrificio(data) {
  try {
    // Obtener los valores de los impuestos
    const impuesto1 = data.impuestos && data.impuestos.length > 0 ? data.impuestos[0].valor_calculado : 0
    const impuesto2 = data.impuestos && data.impuestos.length > 1 ? data.impuestos[1].valor_calculado : 0
    const impuesto3 = data.impuestos && data.impuestos.length > 2 ? data.impuestos[2].valor_calculado : 0

    // Usar directamente la fecha del formulario sin conversiones
    const fecha_documento = data.fecha_documento

    // Insertar la transacción principal
    const result = await sql`
      INSERT INTO transactions (
        business_location_id,
        type,
        estado,
        numero_documento,
        fecha_documento,
        id_dueno_anterior,
        id_dueno_nuevo,
        usuario_id,
        total,
        quantity_k,
        quantity_m,
        quantity_h,
        colors,
        impuesto1,
        impuesto2,
        impuesto3,
        consignante,
        planilla,
        observaciones,
        consec,
        ubication_contact_id,
        ubication_contact_id2
      ) VALUES (
        ${data.business_location_id},
        ${data.type},
        ${data.estado},
        ${data.numero_documento},
        ${fecha_documento},
        ${data.id_dueno_anterior},
        ${data.id_dueno_nuevo || null},
        ${data.usuario_id},
        ${data.total},
        ${data.quantity_k},
        ${data.quantity_m},
        ${data.quantity_h},
        ${data.colors || ""},
        ${impuesto1},
        ${impuesto2},
        ${impuesto3},
        ${data.consignante || null},
        ${data.planilla || null},
        ${data.observaciones || null},
        ${data.consec},
        ${data.ubication_contact_id || null},
        ${data.ubication_contact_id2 || null}
      ) RETURNING id
    `

    const transactionId = result.rows[0].id

    revalidatePath("/sacrificios")
    return { success: true, id: transactionId }
  } catch (error) {
    console.error("Error al crear sacrificio:", error)
    return { success: false, message: error.message }
  }
}

// Actualizar la función updateSacrificio para incluir los nuevos campos
export async function updateSacrificio(id, data) {
  try {
    // Obtener los valores de los impuestos
    const impuesto1 = data.impuestos && data.impuestos.length > 0 ? data.impuestos[0].valor_calculado : 0
    const impuesto2 = data.impuestos && data.impuestos.length > 1 ? data.impuestos[1].valor_calculado : 0
    const impuesto3 = data.impuestos && data.impuestos.length > 2 ? data.impuestos[2].valor_calculado : 0

    // Usar la fecha exacta del formulario sin modificarla
    // Esto evita que se cambie al día siguiente
    const fechaDocumento = data.fecha_documento

    // Actualizar la transacción principal
    await sql`
      UPDATE transactions SET
        business_location_id = ${data.business_location_id},
        estado = ${data.estado},
        numero_documento = ${data.numero_documento},
        fecha_documento = ${fechaDocumento},
        id_dueno_anterior = ${data.id_dueno_anterior},
        id_dueno_nuevo = ${data.id_dueno_nuevo || null},
        total = ${data.total},
        quantity_k = ${data.quantity_k},
        quantity_m = ${data.quantity_m},
        quantity_h = ${data.quantity_h},
        colors = ${data.colors || ""},
        impuesto1 = ${impuesto1},
        impuesto2 = ${impuesto2},
        impuesto3 = ${impuesto3},
        consignante = ${data.consignante || null},
        planilla = ${data.planilla || null},
        observaciones = ${data.observaciones || null},
        consec = ${data.consec},
        ubication_contact_id = ${data.ubication_contact_id || null},
        ubication_contact_id2 = ${data.ubication_contact_id2 || null}
      WHERE id = ${id}
    `

    revalidatePath("/sacrificios")
    revalidatePath(`/sacrificios/ver/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error al actualizar sacrificio:", error)
    return { success: false, message: error.message }
  }
}
