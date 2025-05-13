import { sql } from "@vercel/postgres"

// Función para obtener razas por tipo de animal y ubicación
export async function getRazasByTipoAndLocation(tipoAnimal: string, locationId: number) {
  try {
    // En lugar de filtrar por tipo_animal, filtramos por business_location_id
    const result = await sql`
      SELECT id, name FROM razas 
      WHERE business_location_id = ${locationId}
      AND activo = true
      ORDER BY name
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener razas:", error)
    return []
  }
}

// Función para obtener colores por tipo de animal y ubicación
export async function getColoresByTipoAndLocation(tipoAnimal: string, locationId: number) {
  try {
    // En lugar de filtrar por tipo_animal, filtramos por business_location_id
    const result = await sql`
      SELECT id, name FROM colors 
      WHERE business_location_id = ${locationId}
      AND activo = true
      ORDER BY name
    `
    return result.rows
  } catch (error) {
    console.error("Error al obtener colores:", error)
    return []
  }
}
