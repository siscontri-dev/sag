"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, Search, Filter, X, ArrowUpDown, Calendar } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, startOfDay, endOfDay, isWithinInterval, addDays } from "date-fns"
import { es } from "date-fns/locale"

const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value).toLocaleString("es-CO")
}

export default function GuiasTable({ guias = [], currentLimit = 30 }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [filteredGuias, setFilteredGuias] = useState(guias)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [limit, setLimit] = useState(currentLimit.toString())

  // Inicializar el rango de fechas con la fecha actual
  const today = new Date()
  const [fechaInicio, setFechaInicio] = useState(today)
  const [fechaFin, setFechaFin] = useState(today)

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" })

  // Función para ordenar las guías
  const sortGuias = (guiasToSort, key, direction) => {
    return [...guiasToSort].sort((a, b) => {
      if (key === "fecha_documento") {
        const dateA = a.fecha_documento ? new Date(a.fecha_documento) : new Date(0)
        const dateB = b.fecha_documento ? new Date(b.fecha_documento) : new Date(0)
        return direction === "ascending" ? dateA - dateB : dateB - dateA
      } else if (key === "numero_documento") {
        const numA = a.numero_documento ? Number.parseInt(a.numero_documento) : 0
        const numB = b.numero_documento ? Number.parseInt(b.numero_documento) : 0
        return direction === "ascending" ? numA - numB : numB - numA
      }
      return 0
    })
  }

  // Función para cambiar el ordenamiento
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Función para cambiar el límite de documentos
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit)

    // Crear nuevos parámetros de búsqueda
    const params = new URLSearchParams(searchParams)
    params.set("limit", newLimit)

    // Navegar a la misma ruta con los nuevos parámetros
    router.push(`${pathname}?${params.toString()}`)
  }

  // Calcular totales
  const totales = useMemo(() => {
    return filteredGuias.reduce(
      (acc, guia) => {
        return {
          machos: acc.machos + (Number(guia.quantity_m) || 0),
          hembras: acc.hembras + (Number(guia.quantity_h) || 0),
          animales: acc.animales + (Number(guia.quantity_m) || 0) + (Number(guia.quantity_h) || 0),
          kilos: acc.kilos + (Number(guia.quantity_k) || 0),
          valor: acc.valor + (Number.parseFloat(guia.total) || 0),
        }
      },
      { machos: 0, hembras: 0, animales: 0, kilos: 0, valor: 0 },
    )
  }, [filteredGuias])

  // Aplicar filtros cuando cambian los criterios
  useEffect(() => {
    let result = guias

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter((guia) => {
        // Preparar los nombres completos para la búsqueda
        const nombreAnteriorCompleto = guia.dueno_anterior_nombre
          ? `${guia.dueno_anterior_nombre || ""} ${guia.dueno_anterior_apellido || ""}`.toLowerCase().trim()
          : ""

        // Buscar en todos los campos relevantes
        return (
          // Búsqueda en nombres completos
          (nombreAnteriorCompleto && nombreAnteriorCompleto.includes(term)) ||
          // Búsqueda en campos individuales
          (guia.dueno_anterior_nombre && guia.dueno_anterior_nombre.toLowerCase().includes(term)) ||
          (guia.dueno_anterior_apellido && guia.dueno_anterior_apellido.toLowerCase().includes(term)) ||
          (guia.dueno_anterior_nit && guia.dueno_anterior_nit.toLowerCase().includes(term)) ||
          (guia.numero_documento && guia.numero_documento.toString().includes(term))
        )
      })
    }

    // Filtrar por estado
    if (estadoFilter !== "todos") {
      result = result.filter((guia) => guia.estado === estadoFilter)
    }

    // Filtrar por rango de fechas - con verificación de seguridad
    if (fechaInicio && fechaFin) {
      const fromDate = startOfDay(new Date(fechaInicio))
      const toDate = endOfDay(new Date(fechaFin))

      result = result.filter((guia) => {
        if (!guia.fecha_documento) return false

        // Asegurarse de que la fecha es un objeto Date válido
        let fechaGuia
        try {
          // Convertir a fecha local para comparación
          fechaGuia = new Date(guia.fecha_documento)

          // Verificar si la fecha es válida
          if (isNaN(fechaGuia.getTime())) {
            console.warn(`Fecha inválida en guía ${guia.id}: ${guia.fecha_documento}`)
            return false
          }

          return isWithinInterval(fechaGuia, {
            start: fromDate,
            end: toDate,
          })
        } catch (error) {
          console.error(`Error al procesar fecha en guía ${guia.id}:`, error)
          return false
        }
      })
    }

    // Aplicar ordenamiento
    if (sortConfig.key) {
      result = sortGuias(result, sortConfig.key, sortConfig.direction)
    }

    setFilteredGuias(result)
  }, [guias, searchTerm, estadoFilter, fechaInicio, fechaFin, sortConfig])

  // Determinar el tipo de animal predominante para los colores
  const tipoAnimal = useMemo(() => {
    if (filteredGuias.length === 0) return "general"

    const bovinos = filteredGuias.filter((g) => g.tipo_animal === "bovino").length
    const porcinos = filteredGuias.filter((g) => g.tipo_animal === "porcino").length

    return bovinos >= porcinos ? "bovino" : "porcino"
  }, [filteredGuias])

  // Colores basados en el tipo de animal
  const colors = useMemo(() => {
    return tipoAnimal === "bovino"
      ? themeColors.bovino
      : tipoAnimal === "porcino"
        ? themeColors.porcino
        : { light: "#F9FAFB", medium: "#F3F4F6", dark: "#E5E7EB", text: "#111827" }
  }, [tipoAnimal])

  return (
    <div className="space-y-4">
      {/* Indicadores de totales */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: colors.dark }}>
          <div className="text-sm text-gray-500 font-medium">Total Animales</div>
          <div className="text-2xl font-bold mt-1">{totales.animales.toLocaleString("es-CO")}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: colors.dark }}>
          <div className="text-sm text-gray-500 font-medium">Total Kilos</div>
          <div className="text-2xl font-bold mt-1">{totales.kilos.toLocaleString("es-CO")} kg</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4" style={{ borderLeftColor: colors.dark }}>
          <div className="text-sm text-gray-500 font-medium">Valor Total</div>
          <div className="text-2xl font-bold mt-1">${totales.valor.toLocaleString("es-CO")}</div>
        </div>
      </div>

      {/* Filtros en el cliente */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="w-full sm:w-2/5">
          <Label htmlFor="search-term" className="text-xs mb-1 block">
            Buscar
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-term"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, NIT o número de documento"
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="w-full sm:w-1/5">
          <Label htmlFor="estado-filter" className="text-xs mb-1 block">
            Estado
          </Label>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger id="estado-filter">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borradores</SelectItem>
              <SelectItem value="confirmado">Confirmados</SelectItem>
              <SelectItem value="anulado">Anulados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de fechas mejorado con campos separados */}
        <div className="w-full sm:w-1/3 space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="fecha-inicio" className="text-xs">
              Fecha Inicial
            </Label>
            <Label htmlFor="fecha-fin" className="text-xs">
              Fecha Final
            </Label>
          </div>

          <div className="flex gap-2">
            {/* Selector de fecha inicial */}
            <Popover>
              <PopoverTrigger asChild>
                <Button id="fecha-inicio" variant="outline" className="w-full justify-start text-left font-normal h-9">
                  <Calendar className="mr-2 h-4 w-4" />
                  {fechaInicio ? format(new Date(fechaInicio), "dd/MM/yyyy") : <span>Fecha inicial</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="single"
                  selected={fechaInicio}
                  onSelect={(date) => {
                    setFechaInicio(date || today)
                    // Si la fecha final es anterior a la inicial, actualizarla
                    if (date && fechaFin && date > fechaFin) {
                      setFechaFin(date)
                    }
                  }}
                  defaultMonth={fechaInicio}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            {/* Selector de fecha final */}
            <Popover>
              <PopoverTrigger asChild>
                <Button id="fecha-fin" variant="outline" className="w-full justify-start text-left font-normal h-9">
                  <Calendar className="mr-2 h-4 w-4" />
                  {fechaFin ? format(new Date(fechaFin), "dd/MM/yyyy") : <span>Fecha final</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="single"
                  selected={fechaFin}
                  onSelect={(date) => {
                    setFechaFin(date || today)
                    // Si la fecha inicial es posterior a la final, actualizarla
                    if (date && fechaInicio && date < fechaInicio) {
                      setFechaInicio(date)
                    }
                  }}
                  defaultMonth={fechaFin}
                  locale={es}
                  disabled={(date) => date < new Date(fechaInicio)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Botones de acceso rápido para fechas */}
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 flex-1"
              onClick={() => {
                setFechaInicio(today)
                setFechaFin(today)
              }}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 flex-1"
              onClick={() => {
                const startOfWeek = addDays(today, -today.getDay())
                const endOfWeek = addDays(startOfWeek, 6)
                setFechaInicio(startOfWeek)
                setFechaFin(endOfWeek)
              }}
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 flex-1"
              onClick={() => {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                setFechaInicio(startOfMonth)
                setFechaFin(endOfMonth)
              }}
            >
              Este Mes
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            setSearchTerm("")
            setEstadoFilter("todos")
            setFechaInicio(today)
            setFechaFin(today)
            setSortConfig({ key: null, direction: "ascending" })
          }}
        >
          <Filter className="mr-2 h-4 w-4" />
          Limpiar
        </Button>
      </div>

      {/* Selector de cantidad de documentos y contador de resultados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredGuias.length} de {guias.length} guías
          {fechaInicio && fechaFin && (
            <span className="ml-2">
              (Periodo: {format(new Date(fechaInicio), "dd/MM/yyyy")} - {format(new Date(fechaFin), "dd/MM/yyyy")})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="limit-select" className="text-sm whitespace-nowrap">
            Mostrar:
          </Label>
          <Select value={limit} onValueChange={handleLimitChange}>
            <SelectTrigger id="limit-select" className="w-[180px]">
              <SelectValue placeholder="30 Predeterminado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Predeterminado</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="-1">Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de guías con altura máxima y desplazamiento vertical */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10" style={{ backgroundColor: colors.light }}>
                <TableRow>
                  <TableHead className="font-semibold">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("numero_documento")}
                      className="h-8 px-2 -ml-2 flex items-center"
                    >
                      Número
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <Button
                      variant="ghost"
                      onClick={() => requestSort("fecha_documento")}
                      className="h-8 px-2 -ml-2 flex items-center"
                    >
                      Fecha
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold">Propietario</TableHead>
                  <TableHead className="font-semibold">NIT</TableHead>
                  <TableHead className="font-semibold">Machos</TableHead>
                  <TableHead className="font-semibold">Hembras</TableHead>
                  <TableHead className="font-semibold">T. Animales</TableHead>
                  <TableHead className="font-semibold">Kilos</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      <div className="text-lg font-medium">No se encontraron guías con los filtros aplicados.</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuias.map((guia, index) => {
                    // Calcular el total de animales para cada guía
                    const totalAnimales = (Number(guia.quantity_m) || 0) + (Number(guia.quantity_h) || 0)

                    return (
                      <TableRow
                        key={guia.id}
                        className={index % 2 === 0 ? "bg-white" : `bg-opacity-20`}
                        style={index % 2 !== 0 ? { backgroundColor: colors.light } : {}}
                      >
                        <TableCell className="font-medium">{guia.numero_documento}</TableCell>
                        <TableCell>{guia.fecha_documento ? formatDate(guia.fecha_documento) : ""}</TableCell>
                        <TableCell>{guia.dueno_anterior_nombre || "N/A"}</TableCell>
                        <TableCell>{guia.dueno_anterior_nit || "N/A"}</TableCell>
                        <TableCell>{guia.quantity_m || 0}</TableCell>
                        <TableCell>{guia.quantity_h || 0}</TableCell>
                        <TableCell>{totalAnimales}</TableCell>
                        <TableCell>{guia.quantity_k ? `${formatNumber(guia.quantity_k)} kg` : "0 kg"}</TableCell>
                        <TableCell>
                          <Badge
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor:
                                guia.estado === "confirmado"
                                  ? themeColors.estado.confirmado.bg
                                  : guia.estado === "anulado"
                                    ? themeColors.estado.anulado.bg
                                    : themeColors.estado.borrador.bg,
                              color:
                                guia.estado === "confirmado"
                                  ? themeColors.estado.confirmado.text
                                  : guia.estado === "anulado"
                                    ? themeColors.estado.anulado.text
                                    : themeColors.estado.borrador.text,
                            }}
                          >
                            {guia.estado === "confirmado"
                              ? "Confirmado"
                              : guia.estado === "anulado"
                                ? "Anulado"
                                : "Borrador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(guia.total)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                              <Link href={`/guias/ver/${guia.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                              <Link href={`/guias/editar/${guia.id}`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {/* Fila de totales fuera del área de desplazamiento */}
        <div className="font-semibold" style={{ backgroundColor: colors.medium }}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-right">
                  Totales:
                </TableCell>
                <TableCell>{totales.machos}</TableCell>
                <TableCell>{totales.hembras}</TableCell>
                <TableCell>{totales.animales}</TableCell>
                <TableCell>{formatNumber(totales.kilos)} kg</TableCell>
                <TableCell></TableCell>
                <TableCell className="font-bold">{formatCurrency(totales.valor)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
