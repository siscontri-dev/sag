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

// Función para formatear números sin decimales y con coma como separador de miles
const formatNumber = (value: number): string => {
  return value.toLocaleString("es-CO", {
    style: "decimal",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
}

// Función para formatear moneda sin decimales y con coma como separador de miles
const formatMoneda = (value: number): string => {
  return value
    .toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
    .replace("COP", "")
    .trim()
}

export default function SacrificiosTable({ sacrificios = [], tipoAnimal = "bovino", currentLimit = 30 }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredSacrificios, setFilteredSacrificios] = useState(sacrificios)
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "fecha_documento", direction: "desc" })

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

    // Filtro de búsqueda
    if (searchTerm) {
      result = result.filter((sacrificio) => {
        const searchString =
          `${sacrificio.numero_documento} ${sacrificio.dueno_anterior_nombre || ""} ${sacrificio.dueno_anterior_nit || ""} ${sacrificio.consignante || ""} ${sacrificio.planilla || ""}`.toLowerCase()
        return searchString.includes(searchTerm.toLowerCase())
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
  }, [sacrificios, searchTerm, estadoFilter, fechaInicio, fechaFin, sortConfig])

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
    setSearchTerm("")
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

  // Calcular totales
  const totalMachos = filteredSacrificios.reduce((sum, s) => sum + (s.quantity_m || 0), 0)
  const totalHembras = filteredSacrificios.reduce((sum, s) => sum + (s.quantity_h || 0), 0)
  const totalAnimales = totalMachos + totalHembras
  const totalKilos = filteredSacrificios.reduce((sum, s) => sum + (s.quantity_k || 0), 0)
  const totalDeguello = filteredSacrificios.reduce((sum, s) => sum + (s.impuesto1 || 0), 0)
  const totalFondo = filteredSacrificios.reduce((sum, s) => sum + (s.impuesto2 || 0), 0)
  const totalMatadero = filteredSacrificios.reduce((sum, s) => sum + (s.impuesto3 || 0), 0)
  const totalRefrigeracion = filteredSacrificios.reduce((sum, s) => sum + (s.refrigeration || 0), 0)
  const totalHorasExtras = filteredSacrificios.reduce((sum, s) => sum + (s.extra_hour || 0), 0)
  const totalValor = filteredSacrificios.reduce((sum, s) => sum + (s.total || 0), 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Sacrificios de {tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"}</CardTitle>
        <div className="flex flex-col gap-4 mt-2">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar por número, propietario, NIT..."
                className="pl-8 pr-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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
          <Table>
            <TableHeader className="bg-gray-50">
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
                  Propietario <ArrowUpDown className="h-4 w-4 inline ml-1" />
                </TableHead>
                <TableHead className="font-semibold">NIT</TableHead>
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
                  <TableCell colSpan={16} className="h-24 text-center">
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
                      <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_m || 0)}</TableCell>
                      <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_h || 0)}</TableCell>
                      <TableCell className="px-4 py-2">
                        {formatNumber((sacrificio.quantity_m || 0) + (sacrificio.quantity_h || 0))}
                      </TableCell>
                      <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_k || 0)} kg</TableCell>
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.impuesto1 || 0)}</TableCell>
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.impuesto2 || 0)}</TableCell>
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.impuesto3 || 0)}</TableCell>
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.refrigeration || 0)}</TableCell>
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.extra_hour || 0)}</TableCell>
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
                      <TableCell className="px-4 py-2">{formatMoneda(sacrificio.total)}</TableCell>
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

                  {/* Fila de totales - siempre se muestra */}
                  <TableRow className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <TableCell colSpan={4} className="px-4 py-2 text-right">
                      Totales:
                    </TableCell>
                    <TableCell className="px-4 py-2">{formatNumber(totalMachos)}</TableCell>
                    <TableCell className="px-4 py-2">{formatNumber(totalHembras)}</TableCell>
                    <TableCell className="px-4 py-2 bg-blue-50">{formatNumber(totalAnimales)}</TableCell>
                    <TableCell className="px-4 py-2 bg-blue-50">{formatNumber(totalKilos)} kg</TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalDeguello)}</TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalFondo)}</TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalMatadero)}</TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalRefrigeracion)}</TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalHorasExtras)}</TableCell>
                    <TableCell className="px-4 py-2"></TableCell>
                    <TableCell className="px-4 py-2 bg-green-50">{formatMoneda(totalValor)}</TableCell>
                    <TableCell className="px-4 py-2"></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Resumen de totales destacados */}
        {filteredSacrificios.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Animales</h3>
              <p className="text-2xl font-bold">{formatNumber(totalAnimales)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Kilos</h3>
              <p className="text-2xl font-bold">{formatNumber(totalKilos)} kg</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Total Valor</h3>
              <p className="text-2xl font-bold">{formatMoneda(totalValor)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
