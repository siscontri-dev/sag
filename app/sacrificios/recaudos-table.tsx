"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, X, ArrowUpDown, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import ExportRecaudosButtons from "./export-recaudos-buttons"

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

// Función para formatear números con separador de miles y sin decimales
const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0"
  }
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Función mejorada para formatear fechas de manera consistente en todos los entornos
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return ""

  try {
    // Si es string, intentar diferentes formatos
    let dateObj: Date

    if (typeof date === "string") {
      // Verificar si la fecha ya tiene el formato correcto (DD/MM/YYYY)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const [day, month, year] = date.split("/").map(Number)
        dateObj = new Date(year, month - 1, day)
      }
      // Verificar si es formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
      else if (date.includes("T")) {
        dateObj = new Date(date)
      }
      // Verificar si es formato YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number)
        dateObj = new Date(year, month - 1, day)
      }
      // Otros formatos
      else {
        dateObj = new Date(date)
      }
    } else {
      dateObj = date
    }

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn(`Fecha inválida: ${date}`)
      return ""
    }

    // Formatear manualmente para evitar problemas de locale
    const day = String(dateObj.getDate()).padStart(2, "0")
    const month = String(dateObj.getMonth() + 1).padStart(2, "0")
    const year = dateObj.getFullYear()

    return `${day}/${month}/${year}`
  } catch (error) {
    console.error(`Error al formatear fecha: ${date}`, error)
    return ""
  }
}

export default function RecaudosTable({ sacrificios = [], tipoAnimal = "bovino" }) {
  // Estados para filtros
  const [searchNumero, setSearchNumero] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("todos")
  const [fechaSeleccionada, setFechaSeleccionada] = useState(format(new Date(), "yyyy-MM-dd"))
  const [filteredSacrificios, setFilteredSacrificios] = useState(sacrificios)
  const [sortConfig, setSortConfig] = useState({ key: "numero_documento", direction: "asc" })

  // Verificar si hay algún filtro aplicado
  const hasActiveFilters = searchNumero !== "" || estadoFilter !== "todos" || fechaSeleccionada !== ""

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
        return sacrificio.numero_documento?.toLowerCase().includes(searchNumero.toLowerCase())
      })
    }

    // Filtro de estado
    if (estadoFilter !== "todos") {
      result = result.filter((sacrificio) => sacrificio.estado === estadoFilter)
    }

    // Filtro por fecha seleccionada
    if (fechaSeleccionada) {
      // Crear fecha de inicio (00:00:00) en hora local
      const fechaInicio = new Date(fechaSeleccionada + "T00:00:00")

      // Crear fecha de fin (23:59:59) en hora local
      const fechaFin = new Date(fechaSeleccionada + "T23:59:59.999")

      result = result.filter((sacrificio) => {
        try {
          if (!sacrificio.fecha_documento) return false

          // Normalizar la fecha del sacrificio para comparación
          let fechaSacrificio: Date

          if (typeof sacrificio.fecha_documento === "string") {
            // Si es una cadena ISO, convertir directamente
            if (sacrificio.fecha_documento.includes("T")) {
              fechaSacrificio = new Date(sacrificio.fecha_documento)
            }
            // Si es formato YYYY-MM-DD
            else if (/^\d{4}-\d{2}-\d{2}$/.test(sacrificio.fecha_documento)) {
              fechaSacrificio = new Date(sacrificio.fecha_documento + "T12:00:00")
            }
            // Si es formato DD/MM/YYYY
            else if (/^\d{2}\/\d{2}\/\d{4}$/.test(sacrificio.fecha_documento)) {
              const [day, month, year] = sacrificio.fecha_documento.split("/").map(Number)
              fechaSacrificio = new Date(year, month - 1, day, 12, 0, 0)
            }
            // Otros formatos
            else {
              fechaSacrificio = new Date(sacrificio.fecha_documento)
            }
          } else {
            fechaSacrificio = new Date(sacrificio.fecha_documento)
          }

          // Verificar si la fecha es válida
          if (isNaN(fechaSacrificio.getTime())) {
            console.warn(`Fecha inválida en sacrificio ${sacrificio.id}: ${sacrificio.fecha_documento}`)
            return false
          }

          // Normalizar a solo fecha (sin hora) para comparación
          const soloFechaSacrificio = new Date(
            fechaSacrificio.getFullYear(),
            fechaSacrificio.getMonth(),
            fechaSacrificio.getDate(),
            12,
            0,
            0,
          )

          const soloFechaInicio = new Date(
            fechaInicio.getFullYear(),
            fechaInicio.getMonth(),
            fechaInicio.getDate(),
            0,
            0,
            0,
          )

          const soloFechaFin = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate(), 23, 59, 59)

          return soloFechaSacrificio >= soloFechaInicio && soloFechaSacrificio <= soloFechaFin
        } catch (error) {
          console.error(`Error al procesar fecha en sacrificio ${sacrificio.id}:`, error)
          return false
        }
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
  }, [sacrificios, searchNumero, estadoFilter, fechaSeleccionada, sortConfig])

  // Calcular totales para los indicadores basados en los registros filtrados
  const totalDeguello = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto1) || 0), 0)
  const totalFondo = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto2) || 0), 0)
  const totalMatadero = filteredSacrificios.reduce((sum, s) => sum + (Number(s.impuesto3) || 0), 0)

  // Calcular totales para la tabla
  const totalMachos = filteredSacrificios.reduce((sum, s) => sum + (Number(s.quantity_m) || 0), 0)
  const totalHembras = filteredSacrificios.reduce((sum, s) => sum + (Number(s.quantity_h) || 0), 0)
  const totalAnimales = totalMachos + totalHembras
  const totalValor = filteredSacrificios.reduce((sum, s) => sum + (Number(s.total) || 0), 0)

  // Determinar colores basados en el tipo
  const colors =
    tipoAnimal === "bovino"
      ? { light: "#dbeafe", medium: "#3b82f6", dark: "#2563eb" }
      : tipoAnimal === "porcino"
        ? { light: "#ede9fe", medium: "#8b5cf6", dark: "#7c3aed" }
        : { light: "#f3f4f6", medium: "#9ca3af", dark: "#6b7280" }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setSearchNumero("")
    setEstadoFilter("todos")
    setFechaSeleccionada(format(new Date(), "yyyy-MM-dd"))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Recaudos Diarios</CardTitle>
          <ExportRecaudosButtons
            sacrificios={filteredSacrificios}
            tipoAnimal={tipoAnimal}
            fechaSeleccionada={fechaSeleccionada}
          />
        </div>

        {/* Indicadores de totales */}
        <div className="grid grid-cols-3 gap-3 mt-4">
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
        </div>

        <div className="flex flex-col gap-4 mt-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Fecha específica */}
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="date"
                placeholder="Fecha"
                className="pl-8"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acceso rápido y limpiar filtros */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFechaSeleccionada(format(new Date(), "yyyy-MM-dd"))}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setFechaSeleccionada(format(yesterday, "yyyy-MM-dd"))
                }}
              >
                Ayer
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
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
                      G/DEGUELLO <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_m")}>
                      CANTIDAD <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_m")}>
                      MACHOS <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("quantity_h")}>
                      HEMBRAS <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto1")}>
                      VR DEGUELLO <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto3")}>
                      SER MATADERO <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("impuesto2")}>
                      FEDEGAN <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("total")}>
                      TOTAL <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer" onClick={() => requestSort("estado")}>
                      ESTADO <ArrowUpDown className="h-4 w-4 inline ml-1" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSacrificios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No se encontraron registros para la fecha seleccionada
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredSacrificios.map((sacrificio) => (
                        <TableRow key={sacrificio.id} className="border-b hover:bg-gray-50">
                          <TableCell className="px-4 py-2">{sacrificio.numero_documento}</TableCell>
                          <TableCell className="px-4 py-2">
                            {formatNumber((sacrificio.quantity_m || 0) + (sacrificio.quantity_h || 0))}
                          </TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_m || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.quantity_h || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto1 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto3 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.impuesto2 || 0)}</TableCell>
                          <TableCell className="px-4 py-2">{formatNumber(sacrificio.total || 0)}</TableCell>
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
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Fila de totales fuera del área de desplazamiento */}
          <div className="bg-gray-200 font-semibold border-t-2 border-gray-400">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-2 text-right">TOTAL</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalAnimales)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalMachos)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalHembras)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalDeguello)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalMatadero)}</TableCell>
                  <TableCell className="px-4 py-2">{formatNumber(totalFondo)}</TableCell>
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
