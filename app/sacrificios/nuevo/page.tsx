import { getContacts, getTaxesByLocationType, getConsignantesByLocationId } from "@/lib/data"
import SacrificioForm from "../sacrificio-form"
import { sql } from "@vercel/postgres"

export const metadata = {
  title: "Nuevo Sacrificio",
  description: "Crear un nuevo registro de sacrificio",
}

export default async function NuevoSacrificioPage({ searchParams }) {
  // Obtener el tipo de animal de los parámetros de búsqueda
  const tipo = searchParams.tipo || "bovino"
  const locationId = tipo === "bovino" ? 1 : 2

  // Obtener contactos
  const contactos = await getContacts()

  // Obtener impuestos para este tipo de animal
  const impuestos = await getTaxesByLocationType(tipo)

  // Obtener consignantes para este location_id
  const consignantes = await getConsignantesByLocationId(locationId)
  console.log(`Consignantes obtenidos para ${tipo} (location_id=${locationId}): ${consignantes.length}`)

  // Obtener el último consecutivo para esta ubicación específica
  const ultimoConsecutivoResult = await sql`
    SELECT MAX(consec) as ultimo_consec
    FROM transactions
    WHERE business_location_id = ${locationId} AND type = 'exit'
  `

  // Obtener la última planilla para esta ubicación específica
  const ultimaPlanillaResult = await sql`
    SELECT MAX(planilla) as ultima_planilla
    FROM transactions
    WHERE business_location_id = ${locationId} AND type = 'exit'
  `

  // Convertir a números y manejar valores nulos
  const ultimoConsecutivo = ultimoConsecutivoResult.rows[0]?.ultimo_consec || 0
  const ultimaPlanilla = ultimaPlanillaResult.rows[0]?.ultima_planilla || 0

  console.log(`Último consecutivo para ${tipo} (location_id=${locationId}): ${ultimoConsecutivo}`)
  console.log(`Última planilla para ${tipo} (location_id=${locationId}): ${ultimaPlanilla}`)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Guía de Degüello de {tipo === "bovino" ? "Bovino" : "Porcino"}</h1>
      <SacrificioForm
        contactosAnteriores={contactos}
        contactosNuevos={contactos}
        tipoAnimal={tipo}
        locationId={locationId}
        impuestos={impuestos}
        ultimoConsecutivo={ultimoConsecutivo}
        ultimaPlanilla={ultimaPlanilla}
        consignantes={consignantes} // Pasar los consignantes al formulario
      />
    </div>
  )
}
