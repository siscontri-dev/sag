"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X, ArrowUpDown, Calendar } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Edit, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import ExportButtons from "./export-buttons"

const themeColors = {
  estado: {
    confirmado: {
      bg: "#dcfce7",
      text: "#16a34a",
    },
    anulado: {
      bg: "#fee2e2",
      text: "#dc2626",
    },
    borrador: {
      bg: "#fffbeb",
      text: "#d97706",
    },
  },
}

const formatDate = (date: Date | string): string => {
  if (typeof date === "string") {
    date = new Date(date)
  }
  return date.toLocaleDateString("es-CO")
}

// Modificar la función formatNumber para manejar valores no numéricos
const formatNumber = (value: number | null | undefined): string => {
  // Si el valor es null, undefined o NaN, devolver "0"
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  // Redondear y formatear con comas
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Función mejorada para búsqueda de texto que normaliza y tokeniza
const textMatch = (text: string | null | undefined, search: string): boolean => {
  if (!text || !search) return false

  // Normalizar texto: convertir a minúsculas y eliminar acentos
  const normalizeText = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

  const normalizedText = normalizeText(text)
  const normalizedSearch = normalizeText(search)

  // Búsqueda exacta
  if (normalizedText === normalizedSearch) return true

  // Búsqueda por inclusión
  if (normalizedText.includes(normalizedSearch)) return true

  // Búsqueda por palabras (para manejar nombres completos)
  const searchWords = normalizedSearch.split(/\s+/)
  return searchWords.every((word) => normalizedText.includes(word))
}

export default function SacrificiosTable({ sacrificios = [], tipoAnimal = "bovino", currentLimit = 30 }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estados para filtros
  const [searchNumero, setSearchNumero] = useState("")
  const [searchPropietarioAnterior, setSearchPropietarioAnterior] = useState("")
  const [searchPropietarioNuevo, setSearchPropietarioNuevo] = useState("")
  const [filteredSacrificios, setFilteredSacrificios] = useState(sacrificios)
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "fecha_documento", direction: "desc" })

  // Verificar si hay algún filtro aplicado
  const hasActiveFilters =
    searchNumero !== "" ||
    searchPropietarioAnterior !== "" ||
    searchPropietarioNuevo !== "" ||
    estadoFilter !== "todos" ||
    fechaInicio !== "" ||
    fechaFin !== ""

  // Función para ordenar
  const requestSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  // Función para aplicar filtros
  useEffect(() => {
    let result = [...sacrificios]

    // Filtro por número de documento
    if (searchNumero) {
      result = result.filter((sacrificio) => {
        return textMatch(sacrificio.numero_documento, searchNumero)
      })
    }

    // Filtro por propietario anterior
    if (searchPropietarioAnterior) {
      result = result.filter((sacrificio) => {
        // Buscar en nombre
        if (textMatch(sacrificio.dueno_anterior_nombre, searchPropietarioAnterior)) {
          return true
        }
        // Buscar en NIT
        if (textMatch(sacrificio.dueno_anterior_nit, searchPropietarioAnterior)) {
          return true
        }
        // Buscar en la combinación de ambos
        const combinedText = `${sacrificio.dueno_anterior_nombre || ""} ${sacrificio.dueno_anterior_nit || ""}`
        return textMatch(combinedText, searchPropietarioAnterior)
      })
    }

    // Filtro por propietario nuevo
    if (searchPropietarioNuevo) {
      result = result.filter((sacrificio) => {
        // Buscar en nombre
        if (textMatch(sacrificio.dueno_nuevo_nombre, searchPropietarioNuevo)) {
          return true
        }
        // Buscar en NIT
        if (textMatch(sacrificio.dueno_nuevo_nit, searchPropietarioNuevo)) {
          return true
        }
        // Buscar en la combinación de ambos
        const combinedText = `${sacrificio.dueno_nuevo_nombre || ""} ${sacrificio.dueno_nuevo_nit || ""}`
        return textMatch(combinedText, searchPropietarioNuevo)
      })
    }

    // Filtro de estado
    if (estadoFilter !== "todos") {
      result = result.filter((sacrificio) => sacrificio.estado === estadoFilter)
    }

    // Filtro de fecha
    if (fechaInicio) {
      const inicio = new Date(fechaInicio)
      inicio.setHours(0, 0, 0, 0)
      result = result.filter((sacrificio) => {
        const fecha = new Date(sacrificio.fecha_documento)
        return fecha >= inicio
      })
    }

    if (fechaFin) {
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)
      result = result.filter((sacrificio) => {
        const fecha = new Date(sacrificio.fecha_documento)
        return fecha <= fin
      })
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredSacrificios(result)
  }, [
    sacrificios,
    searchNumero,
    searchPropietarioAnterior,
    searchPropietarioNuevo,
    estadoFilter,
    fechaInicio,
    fechaFin,
    sortConfig,
  ])

  // Función para establecer fechas rápidas
  const setQuickDate = (option) => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (option) {
      case "today":
        // Hoy
        start = today
        end = today
        break
      case "week":
        // Esta semana
        start = new Date(today)
        start.setDate(today.getDate() - today.getDay()) // Domingo de esta semana
        end = new Date(today)
        end.setDate(today.getDate() + (6 - today.getDay())) // Sábado de esta semana
        break
      case "month":
        // Este mes
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      default:
        break
    }

    setFechaInicio(start.toISOString().split("T")[0])
    setFechaFin(end.toISOString().split("T")[0])
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchNumero("")
    setSearchPropietarioAnterior("")
    setSearchPropietarioNuevo("")
    setEstadoFilter("todos")
    setFechaInicio("")
    setFechaFin("")
  }

  // Función para cambiar el límite de documentos
  const changeLimit = (newLimit) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", newLimit)
    if (tipoAnimal) {
      params.set("tipo", tipoAnimal)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Calcular totales para los indicadores basados en los registros filtrados
  const totalDeguello = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto1) || 0), 0)
  const totalFondo = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto2) || 0), 0)
  const totalMatadero = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto3) || 0), 0)
  const totalRefrigeracion = filteredSacrificios.reduce((sum, s) => sum + (Number(s.refrigeration) || 0), 0)

  // Calcular totales para la tabla
  const totalMachos = filteredSacrificios.reduce((sum, s) => sum + (Number(s.quantity_m) || 0), 0)
  const totalHembras = filteredSacrificios.reduce((sum, s) => sum + (Number(s.quantity_h) || 0), 0)
  const totalAnimales = totalMachos + totalHembras
  const totalKilos = filteredSacrificios.reduce((sum, s) => sum + (Number(s.quantity_k) || 0), 0)
  const totalHorasExtras = filteredSacrificios.reduce((sum, s) => sum + (Number(s.extra_hour) || 0), 0)
  const totalValor = filteredSacrificios.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

  // Determinar colores basados en el tipo
  const colors =
    tipoAnimal === "bovino"
      ? { light: "#dbeafe", medium: "#3b82f6", dark: "#2563eb" }
      : tipoAnimal === "porcino"
        ? { light: "#ede9fe", medium: "#8b5cf6", dark: "#7c3aed" }
        : { light: "#f3f4f6", medium: "#9ca3af", dark: "#6b7280" }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Listado de Sacrificios</CardTitle>
          <ExportButtons sacrificios={filteredSacrificios} tipoAnimal={tipoAnimal} />
        </div>

        {/* Indicadores de totales */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div
            className="rounded-lg p-3 shadow-sm flex items-center justify-between"
            style={{ backgroundColor: colors.light, borderLeft: `4px solid ${colors.dark}` }}
          >
            <div className="text-sm font-medium">Degüello</div>
            <div className="text-lg font-bold">${formatNumber(totalDeguello)}</div>
          </div>
          <div
            className="rounded-lg p-3 shadow-sm flex items-center justify-between"
            style={{ backgroundColor: colors.light, borderLeft: `4px solid ${colors.dark}` }}
          >
            <div className="text-sm font-medium">Fondo</div>
            <div className="text-lg font-bold">${formatNumber(totalFondo)}</div>
          </div>
          <div
            className="rounded-lg p-3 shadow-sm flex items-center justify-between"
            style={{ backgroundColor: colors.light, borderLeft: `4px solid ${colors.dark}` }}
          >
            <div className="text-sm font-medium">Matadero</div>
            <div className="text-lg font-bold">${formatNumber(totalMatadero)}</div>
          </div>
          <div
            className="rounded-lg p-3 shadow-sm flex items-center justify-between"
            style={{ backgroundColor: colors.light, borderLeft: `4px solid ${colors.dark}` }}
          >
            <div className="text-sm font-medium">Refrigeración</div>
            <div className="text-lg font-bold">${formatNumber(totalRefrigeracion)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Búsqueda por número */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por número..."
                className="pl-8 pr-8"
                value={searchNumero}
                onChange={(e) => setSearchNumero(e.target.value)}
              />
              {searchNumero && (
                <button
                  onClick={() => setSearchNumero("")}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Búsqueda por propietario anterior */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar propietario anterior..."
                className="pl-8 pr-8"
                value={searchPropietarioAnterior}
                onChange={(e) => setSearchPropietarioAnterior(e.target.value)}
              />
              {searchPropietarioAnterior && (
                <button
                  onClick={() => setSearchPropietarioAnterior("")}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Búsqueda por propietario nuevo */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar propietario nuevo..."
                className="pl-8 pr-8"
                value={searchPropietarioNuevo}
                onChange={(e) => setSearchPropietarioNuevo(e.target.value)}
              />
              {searchPropietarioNuevo && (
                <button
                  onClick={() => setSearchPropietarioNuevo("")}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filtro de estado */}
            <div>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borradores</SelectItem>
                  <SelectItem value="confirmado">Confirmados</SelectItem>
                  <SelectItem value="anulado">Anulados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fechas en una nueva fila */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha inicio */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="date"
                placeholder="Fecha inicio"
                className="pl-8"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            {/* Fecha fin */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="date"
                placeholder="Fecha fin"
                className="pl-8"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acceso rápido y limpiar filtros */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickDate("today")}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDate("week")}>
                Esta Semana
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDate("month")}>
                Este Mes
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>

              {/* Selector de límite */}
              <Select value={currentLimit.toString()} onValueChange={changeLimit}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Mostrar" />
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {/* Contenedor con altura máxima y desplazamiento vertical */}
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("numero_documento")}>
                      Guía <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("fecha_documento")}>
                      Fecha <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => requestSort("dueno_anterior_nombre")}
                    >
                      Propietario Anterior <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold">NIT Anterior</TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => requestSort("dueno_nuevo_nombre")}
                    >
                      Propietario Nuevo <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold">NIT Nuevo</TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_m")}>
                      Machos <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_h")}>
                      Hembras <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold">T. Animales</TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_k")}>
                      Kilos <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto1")}>
                      Degüello <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto2")}>
                      Fondo <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto3")}>
                      Matadero <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("refrigeration")}>
                      Refrigeración <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("extra_hour")}>
                      Horas Extras <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("estado")}>
                      Estado <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("total")}>
                      Total <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSacrificios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={18} className="h-24 text-center">
                        No se encontraron sacrificios
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredSacrificios.map((sacrificio) => (
                        <TableRow key={sacrificio.id} className="border-b hover:bg-gray-50">
                          <TableCell className="px-4 py-2">{sacrificio.numero_documento}</TableCell>
                          <TableCell className="px-4 py-2">{formatDate(sacrificio.fecha_documento)}</TableCell>
                          <TableCell className="px-4 py-2">{sacrificio.dueno_anterior_nombre}</TableCell>
                          <TableCell className="px-4 py-2">{sacrificio.dueno_anterior_nit || "N/A"}</TableCell>
                          <TableCell className="px-4 py-2">{sacrificio.dueno_nuevo_nombre || "N/A"}</TableCell>
                          <TableCell className="px-4 py-2">{sacrificio.dueno_nuevo_nit || "N/A"}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_m || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_h || 0)}</TableCell>
                          <TableCell className="px-4 py-2">
                            {formatNumber((sacrificio.quantity_m || 0) + (sacrificio.quantity_h || 0))}
                          </TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_k || 0)} kg</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto1 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto2 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto3 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.refrigeration || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.extra_hour || 0)}</TableCell>
                          <TableCell className="px-4 py-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                sacrificio.estado === "confirmado"
                                  ? "bg-green-100 text-green-800"
                                  : sacrificio.estado === "anulado"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {sacrificio.estado === "confirmado"
                                ? "Confirmado"
                                : sacrificio.estado === "anulado"
                                  ? "Anulado"
                                  : "Borrador"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.total)}</TableCell>
                          <TableCell className="px-4 py-2 text-center">
                            <div className="flex justify-center space-x-2">
                              <Link
                                href={`/sacrificios/ver/${sacrificio.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/sacrificios/editar/${sacrificio.id}`}
                                className="text-amber-600 hover:text-amber-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
                {/* Fila de totales - siempre se muestra fuera del área de desplazamiento */}
              </Table>
            </div>
          </div>
          {/* Fila de totales fuera del área de desplazamiento */}
          <div className="bg-gray-200 font-semibold border-t-2 border-gray-400">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-2 text-right">
                    TOTAL
                  </TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalMachos)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalHembras)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalAnimales)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalKilos)} kg</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalDeguello)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalFondo)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalMatadero)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalRefrigeracion)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalHorasExtras)}</TableCell>
                  <TableCell className="px-4 py-2"></TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalValor)}</TableCell>
                  <TableCell className="px-4 py-2"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
