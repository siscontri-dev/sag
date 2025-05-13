"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { themeColors } from "@/lib/theme-config"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function InformesPage({
  searchParams,
}: {
  searchParams: {
    tipo?: string
    categoria?: string
    informe?: string
  }
}) {
  // Obtener parámetros de la URL
  const tipo = searchParams.tipo || "bovino"
  const categoria = searchParams.categoria || "ica"
  const informeSeleccionado = searchParams.informe || "tickets"

  // Determinar colores basados en el tipo
  const colors = tipo === "bovino" ? themeColors.bovino : themeColors.porcino

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text }}>
          Informes {tipo === "bovino" ? "Bovinos" : "Porcinos"}
        </h1>
      </div>

      <Tabs defaultValue={tipo} className="w-full">
        <TabsList className="mb-4 w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="bovino"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            onClick={() => {
              const url = new URL(window.location.href)
              url.searchParams.set("tipo", "bovino")
              window.location.href = url.toString()
            }}
          >
            Bovinos
          </TabsTrigger>
          <TabsTrigger
            value="porcino"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
            onClick={() => {
              const url = new URL(window.location.href)
              url.searchParams.set("tipo", "porcino")
              window.location.href = url.toString()
            }}
          >
            Porcinos
          </TabsTrigger>
        </TabsList>

        <div className="mb-6">
          <InformeSelector tipo={tipo} informeSeleccionado={informeSeleccionado} />
        </div>

        <Card>
          <CardContent className="pt-6">
            <InformeContent tipo={tipo} informe={informeSeleccionado} />
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

// Componente para el selector de informes
function InformeSelector({ tipo, informeSeleccionado }) {
  const router = useRouter()

  const handleInformeChange = (value) => {
    const url = new URL(window.location.href)
    url.searchParams.set("informe", value)
    window.location.href = url.toString()
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="informe-selector" className="text-sm font-medium">
        Seleccionar Informe:
      </label>
      <Select value={informeSeleccionado} onValueChange={handleInformeChange}>
        <SelectTrigger className="w-[300px]" id="informe-selector">
          <SelectValue placeholder="Seleccionar informe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tickets">Listado de Tickets</SelectItem>
          <SelectItem value="tickets-agrupados">Tickets Agrupados por Día</SelectItem>
          <SelectItem value="guias">Listado de Guías ICA</SelectItem>
          <SelectItem value="guias-propietario">Guías por Propietario</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

// Componente para mostrar el contenido del informe seleccionado
function InformeContent({ tipo, informe }) {
  // Aquí se renderizará el componente correspondiente al informe seleccionado
  switch (informe) {
    case "tickets":
      return <div>Cargando listado de tickets...</div>
    case "tickets-agrupados":
      return <div>Cargando tickets agrupados por día...</div>
    case "guias":
      return <div>Cargando listado de guías ICA...</div>
    case "guias-propietario":
      return <div>Cargando guías por propietario...</div>
    default:
      return <div>Seleccione un informe para visualizar</div>
  }
}
