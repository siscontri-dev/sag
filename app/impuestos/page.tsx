import type { Metadata } from "next"
import { getTaxes, getTaxesByLocationType } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"
import TaxesTable from "./taxes-table"

export const metadata: Metadata = {
  title: "Gestión de Impuestos",
}

export default async function ImpuestosPage({
  searchParams,
}: {
  searchParams?: {
    tipo?: string
  }
}) {
  const tipo = searchParams?.tipo || ""
  let taxes = []
  let error = null

  try {
    // Obtener impuestos filtrados por tipo si se proporciona
    taxes = tipo ? await getTaxesByLocationType(tipo) : await getTaxes()
  } catch (e) {
    console.error("Error al cargar impuestos:", e)
    error = "No se pudieron cargar los impuestos. Por favor, inténtelo de nuevo más tarde."
  }

  // Agrupar impuestos por ubicación
  const taxesByLocation = taxes.reduce((acc: any, tax: any) => {
    const locationKey = `${tax.location_id}-${tax.location_nombre}`
    if (!acc[locationKey]) {
      acc[locationKey] = {
        id: tax.location_id,
        nombre: tax.location_nombre,
        tipo: tax.location_tipo,
        taxes: [],
      }
    }
    acc[locationKey].taxes.push(tax)
    return acc
  }, {})

  const locationGroups = Object.values(taxesByLocation)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Impuestos</h1>
        <Button asChild>
          <Link href="/impuestos/nuevo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Impuesto
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
          <p>{error}</p>
        </div>
      )}

      {!error && locationGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold">No hay impuestos registrados</h2>
          <p className="mb-4 mt-2 text-sm text-gray-500">
            {tipo
              ? `No se encontraron impuestos para el tipo "${tipo}".`
              : "Comience creando un nuevo impuesto para su sistema."}
          </p>
          <Button asChild>
            <Link href="/impuestos/nuevo">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Impuesto
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {locationGroups.map((group: any) => (
            <div key={group.id} className="rounded-lg border shadow-sm">
              <div className={`rounded-t-lg p-4 ${group.tipo === "bovino" ? "bg-blue-50" : "bg-amber-50"}`}>
                <h2 className={`text-lg font-semibold ${group.tipo === "bovino" ? "text-blue-800" : "text-amber-800"}`}>
                  {group.nombre}
                </h2>
              </div>
              <TaxesTable taxes={group.taxes} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
