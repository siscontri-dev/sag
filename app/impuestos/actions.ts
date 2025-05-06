"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

// Esquema de validación para el formulario de impuestos
const TaxFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  valor: z.coerce.number().min(0, "El valor debe ser mayor o igual a cero"),
  location_id: z.coerce.number().min(1, "La ubicación es requerida"),
})

export type TaxFormState = {
  errors?: {
    nombre?: string[]
    valor?: string[]
    location_id?: string[]
    _form?: string[]
  }
  message?: string | null
}

// Función para crear un nuevo impuesto
export async function createTax(prevState: TaxFormState, formData: FormData) {
  const validatedFields = TaxFormSchema.safeParse({
    nombre: formData.get("nombre"),
    valor: formData.get("valor"),
    location_id: formData.get("location_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Faltan campos requeridos. No se pudo crear el impuesto.",
    }
  }

  const { nombre, valor, location_id } = validatedFields.data

  try {
    await sql`
      INSERT INTO taxes (business_id, location_id, nombre, valor, fecha_creacion, fecha_actualizacion, activo)
      VALUES (1, ${location_id}, ${nombre}, ${valor}, NOW(), NOW(), TRUE)
    `

    revalidatePath("/impuestos")
    redirect("/impuestos")
  } catch (error) {
    console.error("Error al crear impuesto:", error)
    return {
      message: "Error al crear el impuesto. Por favor, inténtelo de nuevo.",
    }
  }
}

// Función para actualizar un impuesto existente
export async function updateTax(id: string, prevState: TaxFormState, formData: FormData) {
  const validatedFields = TaxFormSchema.safeParse({
    nombre: formData.get("nombre"),
    valor: formData.get("valor"),
    location_id: formData.get("location_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Faltan campos requeridos. No se pudo actualizar el impuesto.",
    }
  }

  const { nombre, valor, location_id } = validatedFields.data

  try {
    await sql`
      UPDATE taxes
      SET nombre = ${nombre}, 
          valor = ${valor}, 
          location_id = ${location_id}, 
          fecha_actualizacion = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/impuestos")
    redirect("/impuestos")
  } catch (error) {
    console.error("Error al actualizar impuesto:", error)
    return {
      message: "Error al actualizar el impuesto. Por favor, inténtelo de nuevo.",
    }
  }
}

// Función para eliminar un impuesto (marcar como inactivo)
export async function deleteTax(formData: FormData) {
  const id = formData.get("id")

  try {
    await sql`
      UPDATE taxes
      SET activo = FALSE, fecha_actualizacion = NOW()
      WHERE id = ${id}
    `

    revalidatePath("/impuestos")
  } catch (error) {
    console.error("Error al eliminar impuesto:", error)
    return {
      message: "Error al eliminar el impuesto. Por favor, inténtelo de nuevo.",
    }
  }
}
