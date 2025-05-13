// Añadir manejo de errores y logging para diagnosticar el problema en las funciones de catálogos

export async function getRazasByTipoAndLocation(tipo: string, locationId: number) {
  try {
    console.log(`Obteniendo razas para tipo=${tipo}, locationId=${locationId}`)
    const response = await fetch(`/api/catalogs/razas/${tipo}/${locationId}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Error al obtener razas: ${response.status} ${response.statusText}`)
      return [] // Devolver array vacío en caso de error para evitar que falle la página
    }

    const data = await response.json()
    console.log(`Razas obtenidas: ${data.length}`)
    return data
  } catch (error) {
    console.error("Error al obtener razas:", error)
    return [] // Devolver array vacío en caso de error para evitar que falle la página
  }
}

export async function getColoresByTipoAndLocation(tipo: string, locationId: number) {
  try {
    console.log(`Obteniendo colores para tipo=${tipo}, locationId=${locationId}`)
    const response = await fetch(`/api/catalogs/colores/${tipo}/${locationId}`, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Error al obtener colores: ${response.status} ${response.statusText}`)
      return [] // Devolver array vacío en caso de error para evitar que falle la página
    }

    const data = await response.json()
    console.log(`Colores obtenidos: ${data.length}`)
    return data
  } catch (error) {
    console.error("Error al obtener colores:", error)
    return [] // Devolver array vacío en caso de error para evitar que falle la página
  }
}
