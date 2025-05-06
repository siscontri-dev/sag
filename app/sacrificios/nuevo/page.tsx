import type { Metadata } from "next"
import { sql } from "@vercel/postgres"
import SacrificioForm from "../sacrificio-form"
import { themeColors } from "@/lib/theme-config"

export const metadata: Metadata = {
  title: "Nuevo Sacrificio",
  description: "Crear un nuevo registro de sacrificio",
}

export default async function NuevoSacrificioPage({ searchParams }) {
  const tipo = searchParams.tipo || "bovino"
  const locationId = tipo === "bovino" ? 1 : 2

  try {
    // Obtener contactos para dueño anterior (type 1 o 3)
    const contactosAnterioresResult = await sql`
      SELECT * FROM contacts 
      WHERE activo = true AND (type = 1 OR type = 3)
      ORDER BY primer_nombre, primer_apellido
    `
    const contactosAnteriores = contactosAnterioresResult.rows

    // Obtener contactos para dueño nuevo (type 2 o 3)
    const contactosNuevosResult = await sql`
      SELECT * FROM contacts 
      WHERE activo = true AND (type = 2 OR type = 3)
      ORDER BY primer_nombre, primer_apellido
    `
    const contactosNuevos = contactosNuevosResult.rows

    // Obtener impuestos para la ubicación
    const impuestosResult = await sql`
      SELECT * FROM taxes 
      WHERE location_id = ${locationId} AND activo = true 
      ORDER BY nombre
    `
    const impuestos = impuestosResult.rows

    // Colores según el tipo de animal
    const colors = tipo === "bovino" ? themeColors.bovino : themeColors.porcino

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Nuevo Sacrificio de {tipo === "bovino" ? "Bovino" : "Porcino"}
          </h1>
          <p className="text-gray-500">Complete el formulario para registrar un nuevo sacrificio</p>
        </div>

        <SacrificioForm
          contactosAnteriores={contactosAnteriores}
          contactosNuevos={contactosNuevos}
          tipoAnimal={tipo}
          locationId={locationId}
          impuestos={impuestos}
        />
      </div>
    )
  } catch (error) {
    console.error("Error al cargar datos para el formulario de sacrificio:", error)
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <h2 className="text-lg font-semibold mb-2">Error al cargar datos</h2>
          <p>No se pudieron cargar los datos necesarios para el formulario. Por favor, intente nuevamente más tarde.</p>
          <p className="text-sm mt-2">Detalles técnicos: {error.message}</p>
        </div>
      </div>
    )
  }
}
