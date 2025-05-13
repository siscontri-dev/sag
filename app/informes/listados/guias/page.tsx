import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { themeColors } from "@/lib/theme-config"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { sql } from "@vercel/postgres"
import GuiasTable from "./guias-table"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Función para obtener guías directamente usando sql de @vercel/postgres
async function getGuias(tipo = undefined, limit = 30) {
  try {
    // Convertir tipo de animal a business_location_id
    let locationId = undefined
    if (tipo === "bovino") {
      locationId = 1
    } else if (tipo === "porcino") {
      locationId = 2
    }

    // Construir la consulta usando tagged template literals
    let query
    if (locationId) {
      query = sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = 'entry' AND t.business_location_id = ${locationId}
        ORDER BY 
          t.id DESC
        LIMIT ${limit}
      `
    } else {
      query = sql`
        SELECT 
          t.*,
          ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
          ca.nit AS dueno_anterior_nit,
          cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
          cn.nit AS dueno_nuevo_nit
        FROM 
          transactions t
          LEFT JOIN contacts ca ON t.id_dueno_anterior = ca.id
          LEFT JOIN contacts cn ON t.id_dueno_nuevo = cn.id
        WHERE 
          t.activo = TRUE AND t.type = 'entry'
        ORDER BY 
          t.id DESC
        LIMIT ${limit}
      `
    }

    const result = await query
    return result.rows
  } catch (error) {
    console.error("Error al obtener guías:", error)
    throw error
  }
}

export default async function GuiasListadoPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    limit?: string
    fechaDesde?: string
    fechaHasta?: string
    estado?: string
  }
}) {
  // Añadir al inicio de la función, después de obtener los parámetros
  console.log("Parámetros de búsqueda recibidos:", searchParams)

  const tipo = searchParams.tipo || undefined
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit) : 30
  const fechaDesde = searchParams.fechaDesde || undefined
  const fechaHasta = searchParams.fechaHasta || undefined
  const estado = searchParams.estado || undefined

  // Obtener guías con manejo de errores
  let guias = []
  let guiasError = null
  try {
    // Usar la función local que usa directamente sql de @vercel/postgres
    guias = await getGuias(tipo, limit)
    console.log(`Total de guías obtenidas: ${guias.length}`)
  } catch (error) {
    console.error("Error al obtener guías:", error)
    guiasError = error.message || "Error al obtener guías"
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full border-2 shadow-sm hover:bg-gray-100 transition-all"
          >
            <Link href="/informes/listados">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Listado de Guías ICA {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        {guiasError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{guiasError}</AlertDescription>
          </Alert>
        ) : (
          <GuiasTable guias={guias} currentLimit={limit} />
        )}
      </div>
    </div>
  )
}
