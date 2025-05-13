import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import SacrificiosTable from "./sacrificios-table"
import { getTransactions } from "@/lib/data"
import { themeColors } from "@/lib/theme-config"
import ExportButtons from "./export-buttons"

export default async function SacrificiosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; limit?: string }
}) {
  const tipo = searchParams.tipo || undefined
  const limit = searchParams.limit ? Number.parseInt(searchParams.limit) : 30

  // Obtener todos los sacrificios con el límite especificado
  const sacrificios = await getTransactions("exit", tipo, limit)

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
          <Button variant="outline" size="lg" className="rounded-full p-3" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Guías de Degüello
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            className="rounded-full shadow-md transition-all hover:shadow-lg font-semibold"
            style={{
              backgroundColor: tipo === "bovino" ? "#3b82f6" : "#8b5cf6",
              color: "white",
              border: "none",
            }}
          >
            <Link href={`/sacrificios/nuevo${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Nueva Guía de Degüello
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabla de sacrificios con filtros integrados e indicadores */}
      <SacrificiosTable sacrificios={sacrificios} tipoAnimal={tipo} currentLimit={limit} />

      {/* Botones de exportación al final de la página */}
      <div className="flex justify-end mt-6">
        <ExportButtons tipo={tipo} />
      </div>
    </div>
  )
}
