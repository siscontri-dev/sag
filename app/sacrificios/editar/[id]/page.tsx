import { getContacts, getTransactionById, getTaxesByLocationType } from "@/lib/data"
import SacrificioForm from "../../sacrificio-form"
import { notFound } from "next/navigation"
import { sql } from "@vercel/postgres"

export const metadata = {
  title: "Editar Sacrificio",
  description: "Editar un registro de sacrificio existente",
}

export default async function EditarSacrificioPage({ params }) {
  const id = params.id

  // Obtener la transacción
  const sacrificio = await getTransactionById(id)

  if (!sacrificio) {
    notFound()
  }

  // Determinar el tipo de animal basado en business_location_id
  const tipoAnimal = sacrificio.business_location_id === 1 ? "bovino" : "porcino"
  const locationId = sacrificio.business_location_id

  // Obtener contactos
  const contactos = await getContacts()

  // Obtener impuestos para este tipo de animal
  const impuestos = await getTaxesByLocationType(tipoAnimal)

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

  // Preparar los datos del sacrificio para el formulario
  const sacrificioData = {
    id: sacrificio.id,
    numero_documento: sacrificio.numero_documento,
    fecha_documento: sacrificio.fecha_documento,
    id_dueno_anterior: sacrificio.id_dueno_anterior,
    id_dueno_nuevo: sacrificio.id_dueno_nuevo,
    estado: sacrificio.estado,
    cantidad_machos: sacrificio.quantity_m,
    cantidad_hembras: sacrificio.quantity_h,
    total_kilos: sacrificio.quantity_k,
    colors: sacrificio.colors,
    consignante: sacrificio.consignante,
    planilla: sacrificio.planilla,
    consec: sacrificio.consec,
    observaciones: sacrificio.observaciones,
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Sacrificio de {tipoAnimal === "bovino" ? "Bovino" : "Porcino"}</h1>
      <SacrificioForm
        contactosAnteriores={contactos}
        contactosNuevos={contactos}
        tipoAnimal={tipoAnimal}
        locationId={locationId}
        impuestos={impuestos}
        sacrificio={sacrificioData}
        ultimoConsecutivo={ultimoConsecutivo}
        ultimaPlanilla={ultimaPlanilla}
      />
    </div>
  )
}
