import { Button } from "@/components/ui/button"
import { PlusCircle, Home } from "lucide-react"
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
            Guías de Degüello {tipo && `(${tipo === "bovino" ? "Bovinos" : "Porcinos"})`}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild style={{ backgroundColor: colors.dark, color: colors.text }}>
            <Link href={`/sacrificios/nuevo${tipo ? `?tipo=${tipo}` : ""}`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Guía de Degüello
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabla de sacrificios con filtros integrados */}
      <SacrificiosTable sacrificios={sacrificios} tipoAnimal={tipo} currentLimit={limit} />

      {/* Botones de exportación al final de la página */}
      <div className="flex justify-end mt-6">
        <ExportButtons tipo={tipo} />
      </div>
    </div>
  )
}
