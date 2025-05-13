// Catálogos para razas y colores

export interface CatalogItem {
  id: number
  nombre: string
  tipo_animal: string
  business_location_id: number
  activo: boolean
}

// Función para obtener razas por tipo de animal y ubicación
export async function getRazasByTipoAndLocation(tipo: string, locationId: number): Promise<CatalogItem[]> {
  try {
    // En un entorno real, esto sería una consulta a la base de datos
    // Por ahora, simulamos datos
    const razas: CatalogItem[] = [
      { id: 1, nombre: "Pietran", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 2, nombre: "Duroc", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 3, nombre: "Landrace", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 4, nombre: "Hampshire", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 5, nombre: "Brahman", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 6, nombre: "Angus", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 7, nombre: "Holstein", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 8, nombre: "Charolais", tipo_animal: "bovino", business_location_id: 1, activo: true },
    ]

    return razas.filter((raza) => raza.tipo_animal === tipo && raza.business_location_id === locationId && raza.activo)
  } catch (error) {
    console.error("Error al obtener razas:", error)
    return []
  }
}

// Función para obtener colores por tipo de animal y ubicación
export async function getColoresByTipoAndLocation(tipo: string, locationId: number): Promise<CatalogItem[]> {
  try {
    // En un entorno real, esto sería una consulta a la base de datos
    // Por ahora, simulamos datos
    const colores: CatalogItem[] = [
      { id: 1, nombre: "Negro", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 2, nombre: "Blanco", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 3, nombre: "Café", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 4, nombre: "Pinto", tipo_animal: "bovino", business_location_id: 1, activo: true },
      { id: 5, nombre: "Rosado", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 6, nombre: "Blanco con manchas", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 7, nombre: "Negro con manchas", tipo_animal: "porcino", business_location_id: 2, activo: true },
      { id: 8, nombre: "Gris", tipo_animal: "porcino", business_location_id: 2, activo: true },
    ]

    return colores.filter(
      (color) => color.tipo_animal === tipo && color.business_location_id === locationId && color.activo,
    )
  } catch (error) {
    console.error("Error al obtener colores:", error)
    return []
  }
}
