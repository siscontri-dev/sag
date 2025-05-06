"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"

export async function createContact(formData: FormData) {
  try {
    console.log("Iniciando creación de contacto")

    // Extraer datos del formulario
    const primer_nombre = formData.get("primer_nombre") as string
    const segundo_nombre = (formData.get("segundo_nombre") as string) || null
    const primer_apellido = formData.get("primer_apellido") as string
    const segundo_apellido = (formData.get("segundo_apellido") as string) || null
    const nit = formData.get("nit") as string
    const telefono = (formData.get("telefono") as string) || null
    const email = (formData.get("email") as string) || null
    const type = Number.parseInt(formData.get("type") as string)
    const business_location_id = Number.parseInt(formData.get("business_location_id") as string) || 1

    // Obtener ubicaciones nuevas
    const ubicacionesNuevasStr = formData.get("ubicacionesNuevas") as string
    let ubicacionesNuevas = []
    try {
      ubicacionesNuevas = ubicacionesNuevasStr ? JSON.parse(ubicacionesNuevasStr) : []
      console.log(`Ubicaciones nuevas a crear: ${ubicacionesNuevas.length}`)
    } catch (error) {
      console.error("Error al parsear ubicacionesNuevas:", error)
      return { success: false, message: "Error al procesar las ubicaciones nuevas" }
    }

    // Valor fijo para business_id
    const business_id = 1

    // Validar datos requeridos
    if (!primer_nombre || !primer_apellido || !nit) {
      return { success: false, message: "Faltan campos requeridos" }
    }

    // Verificar si el NIT ya existe para este business_id
    const existingNit = await sql`
      SELECT id FROM contacts 
      WHERE nit = ${nit} AND business_id = ${business_id} AND activo = TRUE
    `

    if (existingNit.rows.length > 0) {
      return { success: false, message: "Ya existe un contacto con este NIT" }
    }

    // Insertar en la base de datos
    const result = await sql`
      INSERT INTO contacts (
        primer_nombre, 
        segundo_nombre,
        primer_apellido, 
        segundo_apellido,
        nit, 
        telefono, 
        email, 
        type, 
        business_id,
        business_location_id,
        activo
      ) 
      VALUES (
        ${primer_nombre}, 
        ${segundo_nombre},
        ${primer_apellido}, 
        ${segundo_apellido},
        ${nit}, 
        ${telefono}, 
        ${email}, 
        ${type}, 
        ${business_id},
        ${business_location_id},
        TRUE
      )
      RETURNING id
    `

    const contactId = result.rows[0].id
    console.log(`Contacto creado con ID: ${contactId}`)

    // Insertar ubicaciones nuevas
    for (const ubicacion of ubicacionesNuevas) {
      try {
        console.log(`Insertando ubicación: ${JSON.stringify(ubicacion)}`)

        // Asegurarse de que los valores numéricos sean números
        const id_departamento = Number(ubicacion.id_departamento)
        const id_municipio = Number(ubicacion.id_municipio)
        const area_hectareas = ubicacion.area_hectareas ? Number(ubicacion.area_hectareas) : null
        const es_principal = Boolean(ubicacion.es_principal)

        await sql`
          INSERT INTO ubication_contact (
            id_contact,
            direccion,
            id_departamento,
            id_municipio,
            nombre_finca,
            area_hectareas,
            es_principal,
            activo
          ) 
          VALUES (
            ${contactId},
            ${ubicacion.direccion},
            ${id_departamento},
            ${id_municipio},
            ${ubicacion.nombre_finca},
            ${area_hectareas},
            ${es_principal},
            TRUE
          )
        `
        console.log(`Ubicación insertada correctamente para contacto ${contactId}`)
      } catch (error) {
        console.error(`Error al insertar ubicación para contacto ${contactId}:`, error)
        // Continuamos con la siguiente ubicación en caso de error
      }
    }

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/contactos")
    revalidatePath(`/contactos/ver/${contactId}`)

    return { success: true, message: "Contacto creado correctamente", contactId }
  } catch (error) {
    console.error("Error al crear contacto:", error)
    return { success: false, message: `Error al guardar el contacto: ${error.message || "Error desconocido"}` }
  }
}

export async function updateContact(id: number, formData: FormData) {
  try {
    console.log(`Iniciando actualización de contacto ID: ${id}`)

    // Extraer datos del formulario
    const primer_nombre = formData.get("primer_nombre") as string
    const segundo_nombre = (formData.get("segundo_nombre") as string) || null
    const primer_apellido = formData.get("primer_apellido") as string
    const segundo_apellido = (formData.get("segundo_apellido") as string) || null
    const nit = formData.get("nit") as string
    const telefono = (formData.get("telefono") as string) || null
    const email = (formData.get("email") as string) || null
    const type = Number.parseInt(formData.get("type") as string)
    const business_location_id = Number.parseInt(formData.get("business_location_id") as string) || 1

    // Obtener ubicaciones nuevas y eliminadas
    const ubicacionesNuevasStr = formData.get("ubicacionesNuevas") as string
    const ubicacionesEliminadasStr = formData.get("ubicacionesEliminadas") as string

    let ubicacionesNuevas = []
    let ubicacionesEliminadas = []

    try {
      ubicacionesNuevas = ubicacionesNuevasStr ? JSON.parse(ubicacionesNuevasStr) : []
      ubicacionesEliminadas = ubicacionesEliminadasStr ? JSON.parse(ubicacionesEliminadasStr) : []
      console.log(`Ubicaciones nuevas: ${ubicacionesNuevas.length}, eliminadas: ${ubicacionesEliminadas.length}`)
    } catch (error) {
      console.error("Error al parsear ubicaciones:", error)
      return { success: false, message: "Error al procesar las ubicaciones" }
    }

    // Valor fijo para business_id
    const business_id = 1

    // Validar datos requeridos
    if (!primer_nombre || !primer_apellido || !nit) {
      return { success: false, message: "Faltan campos requeridos" }
    }

    // Verificar si el NIT ya existe para otro contacto con el mismo business_id
    const existingNit = await sql`
      SELECT id FROM contacts 
      WHERE nit = ${nit} AND business_id = ${business_id} AND id != ${id} AND activo = TRUE
    `

    if (existingNit.rows.length > 0) {
      return { success: false, message: "Ya existe otro contacto con este NIT" }
    }

    // Actualizar en la base de datos
    await sql`
      UPDATE contacts 
      SET 
        primer_nombre = ${primer_nombre}, 
        segundo_nombre = ${segundo_nombre},
        primer_apellido = ${primer_apellido}, 
        segundo_apellido = ${segundo_apellido},
        nit = ${nit}, 
        telefono = ${telefono}, 
        email = ${email}, 
        type = ${type},
        business_location_id = ${business_location_id}
      WHERE id = ${id}
    `

    console.log(`Contacto actualizado con ID: ${id}`)

    // Insertar ubicaciones nuevas
    for (const ubicacion of ubicacionesNuevas) {
      try {
        console.log(`Insertando ubicación: ${JSON.stringify(ubicacion)}`)

        // Asegurarse de que los valores numéricos sean números
        const id_departamento = Number(ubicacion.id_departamento)
        const id_municipio = Number(ubicacion.id_municipio)
        const area_hectareas = ubicacion.area_hectareas ? Number(ubicacion.area_hectareas) : null
        const es_principal = Boolean(ubicacion.es_principal)

        await sql`
          INSERT INTO ubication_contact (
            id_contact,
            direccion,
            id_departamento,
            id_municipio,
            nombre_finca,
            area_hectareas,
            es_principal,
            activo
          ) 
          VALUES (
            ${id},
            ${ubicacion.direccion},
            ${id_departamento},
            ${id_municipio},
            ${ubicacion.nombre_finca},
            ${area_hectareas},
            ${es_principal},
            TRUE
          )
        `
        console.log(`Ubicación insertada correctamente para contacto ${id}`)
      } catch (error) {
        console.error(`Error al insertar ubicación para contacto ${id}:`, error)
        // Continuamos con la siguiente ubicación en caso de error
      }
    }

    // Marcar como inactivas las ubicaciones eliminadas
    for (const ubicacionId of ubicacionesEliminadas) {
      try {
        console.log(`Eliminando ubicación ID: ${ubicacionId}`)
        await sql`
          UPDATE ubication_contact 
          SET activo = FALSE
          WHERE id = ${ubicacionId} AND id_contact = ${id}
        `
        console.log(`Ubicación ${ubicacionId} marcada como inactiva`)
      } catch (error) {
        console.error(`Error al eliminar ubicación ${ubicacionId}:`, error)
        // Continuamos con la siguiente ubicación en caso de error
      }
    }

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/contactos")
    revalidatePath(`/contactos/ver/${id}`)
    revalidatePath(`/contactos/editar/${id}`)

    return { success: true, message: "Contacto actualizado correctamente" }
  } catch (error) {
    console.error("Error al actualizar contacto:", error)
    return { success: false, message: `Error al actualizar el contacto: ${error.message || "Error desconocido"}` }
  }
}

export async function deleteContact(id: number) {
  try {
    // Marcar como inactivo en lugar de eliminar físicamente
    await sql`
      UPDATE contacts 
      SET activo = FALSE
      WHERE id = ${id}
    `

    // También marcar como inactivas las relaciones con ubicaciones
    await sql`
      UPDATE ubication_contact
      SET activo = FALSE
      WHERE id_contact = ${id}
    `

    // Revalidar la ruta para actualizar los datos
    revalidatePath("/contactos")

    return { success: true, message: "Contacto eliminado correctamente" }
  } catch (error) {
    console.error("Error al eliminar contacto:", error)
    return { success: false, message: "Error al eliminar el contacto" }
  }
}

// Nuevas acciones para manejar ubicaciones
export async function createUbication(contactId: number, formData: FormData) {
  try {
    // Extraer datos del formulario
    const direccion = formData.get("direccion") as string
    const id_departamento = Number.parseInt(formData.get("id_departamento") as string)
    const id_municipio = Number.parseInt(formData.get("id_municipio") as string)
    const nombre_finca = formData.get("nombre_finca") as string
    const area_hectareas = formData.get("area_hectareas")
      ? Number.parseFloat(formData.get("area_hectareas") as string)
      : null
    const es_principal = formData.get("es_principal") === "true"

    // Validar datos requeridos
    if (!direccion || !id_departamento || !id_municipio || !nombre_finca) {
      return { success: false, message: "Faltan campos requeridos" }
    }

    // Insertar en la base de datos
    const result = await sql`
      INSERT INTO ubication_contact (
        id_contact,
        direccion,
        id_departamento,
        id_municipio,
        nombre_finca,
        area_hectareas,
        es_principal,
        activo
      ) 
      VALUES (
        ${contactId},
        ${direccion},
        ${id_departamento},
        ${id_municipio},
        ${nombre_finca},
        ${area_hectareas},
        ${es_principal},
        TRUE
      )
      RETURNING id
    `

    const ubicationId = result.rows[0].id

    // Revalidar la ruta para actualizar los datos
    revalidatePath(`/contactos/ubicaciones/${contactId}`)
    revalidatePath(`/contactos/ver/${contactId}`)

    return { success: true, message: "Ubicación creada correctamente", id: ubicationId }
  } catch (error) {
    console.error("Error al crear ubicación:", error)
    return { success: false, message: `Error al guardar la ubicación: ${error.message || "Error desconocido"}` }
  }
}

export async function deleteUbication(id: number, contactId: number) {
  try {
    // Marcar como inactivo en lugar de eliminar físicamente
    await sql`
      UPDATE ubication_contact 
      SET activo = FALSE
      WHERE id = ${id}
    `

    // Revalidar la ruta para actualizar los datos
    revalidatePath(`/contactos/ubicaciones/${contactId}`)
    revalidatePath(`/contactos/ver/${contactId}`)

    return { success: true, message: "Ubicación eliminada correctamente" }
  } catch (error) {
    console.error("Error al eliminar ubicación:", error)
    return { success: false, message: "Error al eliminar la ubicación" }
  }
}
