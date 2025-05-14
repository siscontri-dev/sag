import { unstable_noStore as noStore } from "next/cache"
import { sql } from "@vercel/postgres"

// Interfaz para los datos de ICA
export interface IcaItem {
  id: string
  numeroGuia: string
  fecha: string
  propietario: string
  machos: number
  hembras: number
  totalAnimales: number
  kilos: number
  total: number
}

// Función para obtener los datos ICA de bovinos o porcinos
export async function getIcaData(tipoAnimal: "bovinos" | "porcinos") {
  noStore()
  try {
    // Determinar el business_location_id según el tipo de animal
    const businessLocationId = tipoAnimal === "bovinos" ? 1 : 2

    // Usar una consulta más simple y directa
    const result = await sql.query(
      `
      SELECT
        t.id,
        t.numero_documento AS numero_guia,
        t.fecha_documento AS fecha_raw,
        c.name AS propietario,
        t.quantity_m AS machos,
        t.quantity_h AS hembras,
        t.quantity_k AS kilos,
        t.total
      FROM
        transactions t
      LEFT JOIN
        contacts c ON t.id_dueno_anterior = c.id
      WHERE
        t.type = 'entry'
        AND t.business_location_id = $1
      ORDER BY
        t.fecha_documento DESC
      LIMIT 100
    `,
      [businessLocationId],
    )

    // Mapear los resultados a la interfaz IcaItem
    const mappedResults = result.rows.map((row) => {
      // Formatear la fecha manualmente
      const fechaRaw = row.fecha_raw ? new Date(row.fecha_raw) : new Date()
      const dia = fechaRaw.getDate().toString().padStart(2, "0")
      const mes = (fechaRaw.getMonth() + 1).toString().padStart(2, "0")
      const anio = fechaRaw.getFullYear()
      const fechaFormateada = `${dia}/${mes}/${anio}`

      const machos = Number(row.machos) || 0
      const hembras = Number(row.hembras) || 0

      return {
        id: row.id,
        numeroGuia: row.numero_guia || "",
        fecha: fechaFormateada,
        propietario: row.propietario || "",
        machos: machos,
        hembras: hembras,
        totalAnimales: machos + hembras,
        kilos: Number(row.kilos) || 0,
        total: Number(row.total) || 0,
      }
    })

    return mappedResults
  } catch (error) {
    console.error(`Error al obtener datos ICA para ${tipoAnimal}:`, error)
    // Devolver un array vacío en caso de error
    return []
  }
}
