"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Search } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export default function TicketsAgrupadosFiltros({ tipo }: { tipo?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estados para los filtros
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(
    searchParams.get("fechaDesde") ? new Date(searchParams.get("fechaDesde") as string) : undefined,
  )
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(
    searchParams.get("fechaHasta") ? new Date(searchParams.get("fechaHasta") as string) : undefined,
  )
  const [tipoAnimal, setTipoAnimal] = useState<string>(tipo || "")

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Establecer tab a tickets-agrupados
    params.set("tab", "tickets-agrupados")

    // Filtro de tipo de animal
    if (tipoAnimal) {
      params.set("tipo", tipoAnimal)
    } else {
      params.delete("tipo")
    }

    // Filtros de fecha
    if (fechaDesde) {
      params.set("fechaDesde", format(fechaDesde, "yyyy-MM-dd"))
    } else {
      params.delete("fechaDesde")
    }

    if (fechaHasta) {
      params.set("fechaHasta", format(fechaHasta, "yyyy-MM-dd"))
    } else {
      params.delete("fechaHasta")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFechaDesde(undefined)
    setFechaHasta(undefined)
    setTipoAnimal("")

    const params = new URLSearchParams()
    params.set("tab", "tickets-agrupados")
    router.push(`${pathname}?${params.toString()}`)
  }

  // Función para aplicar filtros rápidos
  const aplicarFiltroRapido = (filtro: string) => {
    const hoy = new Date()
    let desde: Date | undefined = undefined
    let hasta: Date | undefined = undefined

    switch (filtro) {
      case "hoy":
        desde = new Date(hoy)
        hasta = new Date(hoy)
        break
      case "semana":
        desde = new Date(hoy)
        desde.setDate(hoy.getDate() - hoy.getDay()) // Domingo de esta semana
        hasta = new Date(desde)
        hasta.setDate(desde.getDate() + 6) // Sábado de esta semana
        break
      case "mes":
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1) // Primer día del mes
        hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0) // Último día del mes
        break
    }

    setFechaDesde(desde)
    setFechaHasta(hasta)

    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "tickets-agrupados")

    if (tipoAnimal) {
      params.set("tipo", tipoAnimal)
    } else {
      params.delete("tipo")
    }

    if (desde) {
      params.set("fechaDesde", format(desde, "yyyy-MM-dd"))
    } else {
      params.delete("fechaDesde")
    }

    if (hasta) {
      params.set("fechaHasta", format(hasta, "yyyy-MM-dd"))
    } else {
      params.delete("fechaHasta")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Selector de tipo de animal */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Animal</label>
            <Select value={tipoAnimal} onValueChange={setTipoAnimal}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="bovino">Bovinos</SelectItem>
                <SelectItem value="porcino">Porcinos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector de fecha desde */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Desde</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaDesde ? format(fechaDesde, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Selector de fecha hasta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Hasta</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaHasta ? format(fechaHasta, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col justify-end space-y-2">
            <Button onClick={aplicarFiltros} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido("hoy")} className="flex-1">
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido("semana")} className="flex-1">
                Semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido("mes")} className="flex-1">
                Mes
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
