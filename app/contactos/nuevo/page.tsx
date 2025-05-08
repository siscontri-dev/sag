import { getDepartamentos } from "@/lib/data"
import ContactForm from "../contact-form"

export default async function NuevoContactoPage({ searchParams }) {
  const departamentos = await getDepartamentos()
  const businessLocationId = searchParams?.business_location_id
    ? Number.parseInt(searchParams.business_location_id)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {businessLocationId === 1
            ? "Nuevo Contacto de Bovinos"
            : businessLocationId === 2
              ? "Nuevo Contacto de Porcinos"
              : "Nuevo Contacto"}
        </h1>
      </div>
      <ContactForm departamentos={departamentos} defaultBusinessLocationId={businessLocationId} />
    </div>
  )
}
