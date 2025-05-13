import { Button } from "@/components/ui/button"
import { PlusCircle, Home } from "lucide-react"
import Link from "next/link"
import GuiasTable from "./guias-table"
import ExportButtons from "./export-buttons"
import { getTransactions } from "@/lib/data"
import { themeColors } from "@/lib/theme-config"

// Modificar la función para determinar el tipo de animal basado en business_location_id
export default async function GuiasPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    propietario?: string
    propietario_id?: string
    limit?: string
  }
}) {
  // Añadir al inicio de la función, después de obtener los parámetros
  console.log("Parámetros de búsqueda recibidos:", searchParams)

  const tipo = searchParams.tipo || undefined
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit) : 30

  // Obtener guías con manejo de errores
  let guias = []
  try {
    guias = await getTransactions("entry", tipo, limit)
    console.log(`Total de guías obtenidas: ${guias.length}`)
  } catch (error) {
    console.error("Error al obtener guías:", error)
    // Continuar con array vacío
  }

  // Determinar el tipo de animal para cada guía basado en business_location_id
  guias.forEach((guia) => {
    guia.tipo_animal = guia.business_location_id === 1 ? "bovino" : "porcino"
  })

  // Determinar colores basados en el tipo
  const colors =
    tipo === "bovino"
      ? themeColors.bovino
      : tipo === "porcino"
        ? themeColors.porcino
        : { light: "#F9FAFB", medium: "#F3F4F6", dark: "#E5E7EB", text: "#111827" }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild style={{ backgroundColor: colors.dark, color: colors.text }}>
            <Link href={`/guias/nueva${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía
            </Link>
          </Button>
        </div>
      </div>

      {/* Listado de guías con botones de exportación */}
      <div className="space-y-4">
        <ExportButtons tipo={tipo} />
        <GuiasTable guias={guias} currentLimit={limit} />
      </div>
    </div>
  )
}
