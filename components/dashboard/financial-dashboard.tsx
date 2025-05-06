"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getFinancialData } from "@/app/informes/actions"

// Colores para los gráficos
const COLORS = {
  blue: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
  green: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  amber: ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7"],
  purple: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
  red: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fee2e2"],
  indigo: ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe"],
}

// Función para formatear números como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value)
}

// Función para formatear porcentajes
const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`
}

export function FinancialDashboard({ initialData = null }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("month")
  const [data, setData] = useState(initialData || { transactions: [], monthlyStats: [], animalTypeStats: [] })
  const [loading, setLoading] = useState(!initialData)
  // Añadir un nuevo estado para el filtro de ubicaciones
  const [locationFilter, setLocationFilter] = useState<number | null>(null)

  // Cargar datos si no se proporcionaron inicialmente
  useEffect(() => {
    if (!initialData) {
      const fetchData = async () => {
        try {
          setLoading(true)
          const financialData = await getFinancialData()
          setData(financialData)
        } catch (error) {
          console.error("Error al cargar datos financieros:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [initialData])

  // Preparar datos para los gráficos
  const prepareChartData = () => {
    if (loading || !data.transactions || data.transactions.length === 0) {
      return {
        incomeVsExpense: [],
        taxDistribution: [],
        deguelloDistribution: [],
        monthlyTrend: [],
        animalComparison: [],
      }
    }

    // Filtrar datos según el rango de tiempo seleccionado
    const now = new Date()
    const startDate = new Date()

    if (timeRange === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (timeRange === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else if (timeRange === "quarter") {
      startDate.setMonth(now.getMonth() - 3)
    } else if (timeRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1)
    }

    // Filtrar transacciones por fecha y ubicación si está seleccionada
    const filteredTransactions = data.transactions.filter((t) => {
      const dateFilter = new Date(t.fecha_documento) >= startDate
      const locationFilterMatch = locationFilter === null || t.business_location_id === locationFilter
      return dateFilter && locationFilterMatch
    })

    // Datos para gráfico de barras de guías vs sacrificios
    const incomeVsExpense = [
      {
        name: "Guías ICA",
        valor: filteredTransactions.filter((t) => t.type === "entry").reduce((sum, t) => sum + Number(t.total || 0), 0),
      },
      {
        name: "Sacrificios",
        valor: filteredTransactions.filter((t) => t.type === "exit").reduce((sum, t) => sum + Number(t.total || 0), 0),
      },
    ]

    // Datos para gráfico de distribución de impuestos
    const taxDistribution = [
      {
        name: "Deguello",
        valor: filteredTransactions
          .filter((t) => t.type === "exit")
          .reduce((sum, t) => sum + Number(t.impuesto1 || 0), 0),
      },
      {
        name: "Fondo",
        valor: filteredTransactions
          .filter((t) => t.type === "exit")
          .reduce((sum, t) => sum + Number(t.impuesto2 || 0), 0),
      },
      {
        name: "Matadero",
        valor: filteredTransactions
          .filter((t) => t.type === "exit")
          .reduce((sum, t) => sum + Number(t.impuesto3 || 0), 0),
      },
    ]

    // Datos para gráfico de distribución de deguello
    const deguelloTotal = filteredTransactions
      .filter((t) => t.type === "exit")
      .reduce((sum, t) => sum + Number(t.impuesto1 || 0), 0)

    const deguelloDistribution = [
      {
        name: "Alcaldía (50%)",
        valor: deguelloTotal * 0.5,
      },
      {
        name: "Gobernación (50%)",
        valor: deguelloTotal * 0.5,
      },
    ]

    // Datos para gráfico de tendencia por mes
    let monthlyTrend = []

    if (data.monthlyStats && data.monthlyStats.length > 0) {
      monthlyTrend = data.monthlyStats.map((stat) => ({
        name: format(new Date(stat.mes + "-01"), "MMM yyyy", { locale: es }),
        guias: Number(stat.total_guias || 0),
        sacrificios: Number(stat.total_sacrificios || 0),
        deguello: Number(stat.total_deguello || 0),
        fondo: Number(stat.total_fondo || 0),
        matadero: Number(stat.total_matadero || 0),
      }))
    } else {
      // Fallback si no hay datos mensuales
      const monthlyData = {}

      filteredTransactions.forEach((t) => {
        const date = new Date(t.fecha_documento)
        const monthYear = format(date, "MMM yyyy", { locale: es })

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            guias: 0,
            sacrificios: 0,
            deguello: 0,
            fondo: 0,
            matadero: 0,
          }
        }

        if (t.type === "entry") {
          monthlyData[monthYear].guias += Number(t.total || 0)
        } else if (t.type === "exit") {
          monthlyData[monthYear].sacrificios += Number(t.total || 0)
          monthlyData[monthYear].deguello += Number(t.impuesto1 || 0)
          monthlyData[monthYear].fondo += Number(t.impuesto2 || 0)
          monthlyData[monthYear].matadero += Number(t.impuesto3 || 0)
        }
      })

      monthlyTrend = Object.keys(monthlyData).map((month) => ({
        name: month,
        ...monthlyData[month],
      }))
    }

    // Datos para gráfico de comparación bovinos vs porcinos
    let animalComparison = []

    if (data.animalTypeStats && data.animalTypeStats.length > 0) {
      // Mapear business_location_id a nombres
      const locationMap = {
        1: "Bovinos",
        2: "Porcinos",
      }

      // Preparar datos para cada tipo de comparación
      const comparisonCategories = [
        { name: "Guías", key: "total_guias" },
        { name: "Sacrificios", key: "total_sacrificios" },
        { name: "Deguello", key: "total_deguello" },
      ]

      animalComparison = comparisonCategories.map((category) => {
        const item = { name: category.name }

        data.animalTypeStats.forEach((stat) => {
          const animalType = locationMap[stat.business_location_id] || `Tipo ${stat.business_location_id}`
          item[animalType] = Number(stat[category.key] || 0)
        })

        return item
      })
    } else {
      // Fallback si no hay datos por tipo de animal
      const animalTypeData = {
        bovinos: {
          guias: filteredTransactions
            .filter((t) => t.type === "entry" && t.business_location_id === 1)
            .reduce((sum, t) => sum + Number(t.total || 0), 0),
          sacrificios: filteredTransactions
            .filter((t) => t.type === "exit" && t.business_location_id === 1)
            .reduce((sum, t) => sum + Number(t.total || 0), 0),
          deguello: filteredTransactions
            .filter((t) => t.type === "exit" && t.business_location_id === 1)
            .reduce((sum, t) => sum + Number(t.impuesto1 || 0), 0),
        },
        porcinos: {
          guias: filteredTransactions
            .filter((t) => t.type === "entry" && t.business_location_id === 2)
            .reduce((sum, t) => sum + Number(t.total || 0), 0),
          sacrificios: filteredTransactions
            .filter((t) => t.type === "exit" && t.business_location_id === 2)
            .reduce((sum, t) => sum + Number(t.total || 0), 0),
          deguello: filteredTransactions
            .filter((t) => t.type === "exit" && t.business_location_id === 2)
            .reduce((sum, t) => sum + Number(t.impuesto1 || 0), 0),
        },
      }

      animalComparison = [
        {
          name: "Guías",
          Bovinos: animalTypeData.bovinos.guias,
          Porcinos: animalTypeData.porcinos.guias,
        },
        {
          name: "Sacrificios",
          Bovinos: animalTypeData.bovinos.sacrificios,
          Porcinos: animalTypeData.porcinos.sacrificios,
        },
        {
          name: "Deguello",
          Bovinos: animalTypeData.bovinos.deguello,
          Porcinos: animalTypeData.porcinos.deguello,
        },
      ]
    }

    return {
      incomeVsExpense,
      taxDistribution,
      deguelloDistribution,
      monthlyTrend,
      animalComparison,
    }
  }

  const chartData = prepareChartData()

  // Calcular totales para tarjetas de resumen
  const totalGuias = data.transactions
    .filter((t) => t.type === "entry" && (locationFilter === null || t.business_location_id === locationFilter))
    .reduce((sum, t) => sum + Number(t.total || 0), 0)

  const totalSacrificios = data.transactions
    .filter((t) => t.type === "exit" && (locationFilter === null || t.business_location_id === locationFilter))
    .reduce((sum, t) => sum + Number(t.total || 0), 0)

  const totalDeguello = data.transactions
    .filter((t) => t.type === "exit" && (locationFilter === null || t.business_location_id === locationFilter))
    .reduce((sum, t) => sum + Number(t.impuesto1 || 0), 0)

  const totalFondo = data.transactions
    .filter((t) => t.type === "exit" && (locationFilter === null || t.business_location_id === locationFilter))
    .reduce((sum, t) => sum + Number(t.impuesto2 || 0), 0)

  const totalMatadero = data.transactions
    .filter((t) => t.type === "exit" && (locationFilter === null || t.business_location_id === locationFilter))
    .reduce((sum, t) => sum + Number(t.impuesto3 || 0), 0)

  // Calcular porcentajes de cambio (simulados para este ejemplo)
  const changePercent = {
    guias: 0.12,
    sacrificios: 0.08,
    deguello: 0.15,
    fondo: 0.05,
    matadero: 0.1,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando datos financieros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Financiero</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex space-x-2">
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("week")}
            >
              Semana
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("month")}
            >
              Mes
            </Button>
            <Button
              variant={timeRange === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("quarter")}
            >
              Trimestre
            </Button>
            <Button
              variant={timeRange === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("year")}
            >
              Año
            </Button>
          </div>
          <div className="flex space-x-2 mt-2 sm:mt-0 sm:ml-4">
            <Button
              variant={locationFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setLocationFilter(null)}
            >
              Todos
            </Button>
            <Button
              variant={locationFilter === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setLocationFilter(1)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Bovinos
            </Button>
            <Button
              variant={locationFilter === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => setLocationFilter(2)}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Porcinos
            </Button>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Guías ICA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGuias)}</div>
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  changePercent.guias > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {changePercent.guias > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercent(Math.abs(changePercent.guias))}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sacrificios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSacrificios)}</div>
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  changePercent.sacrificios > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {changePercent.sacrificios > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercent(Math.abs(changePercent.sacrificios))}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impuesto Deguello</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeguello)}</div>
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  changePercent.deguello > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {changePercent.deguello > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercent(Math.abs(changePercent.deguello))}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fondo Fedegan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFondo)}</div>
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  changePercent.fondo > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {changePercent.fondo > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercent(Math.abs(changePercent.fondo))}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Servicio Matadero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMatadero)}</div>
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  changePercent.matadero > 0 ? "text-green-500" : "text-red-500",
                )}
              >
                {changePercent.matadero > 0 ? (
                  <ArrowUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercent(Math.abs(changePercent.matadero))}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas para diferentes vistas */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
        </TabsList>

        {/* Pestaña de Resumen */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Guías vs Sacrificios</CardTitle>
                <CardDescription>Comparación entre guías ICA y sacrificios</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.incomeVsExpense}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="valor" name="Valor Total" fill={COLORS.blue[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Impuestos</CardTitle>
                <CardDescription>Desglose de los diferentes impuestos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.taxDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.taxDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.purple[index % COLORS.purple.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña de Impuestos */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución del Impuesto de Deguello</CardTitle>
                <CardDescription>Valores monetarios para Alcaldía (50%) y Gobernación (50%)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.deguelloDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="valor"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      <Cell fill={COLORS.green[1]} />
                      <Cell fill={COLORS.green[3]} />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose de Impuestos por Sacrificio</CardTitle>
                <CardDescription>Comparación de los diferentes impuestos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.taxDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="valor" name="Valor Total" fill={COLORS.amber[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pestaña de Tendencias */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Mensual</CardTitle>
              <CardDescription>Evolución de ingresos y gastos a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="guias" name="Guías ICA" stroke={COLORS.blue[1]} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="sacrificios" name="Sacrificios" stroke={COLORS.amber[1]} />
                  <Line type="monotone" dataKey="deguello" name="Deguello" stroke={COLORS.purple[1]} />
                  <Line type="monotone" dataKey="fondo" name="Fondo" stroke={COLORS.green[1]} />
                  <Line type="monotone" dataKey="matadero" name="Matadero" stroke={COLORS.red[1]} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolución de Impuestos</CardTitle>
              <CardDescription>Tendencia de recaudación de impuestos</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="deguello"
                    name="Deguello"
                    stackId="1"
                    stroke={COLORS.purple[1]}
                    fill={COLORS.purple[1]}
                  />
                  <Area
                    type="monotone"
                    dataKey="fondo"
                    name="Fondo"
                    stackId="1"
                    stroke={COLORS.green[1]}
                    fill={COLORS.green[1]}
                  />
                  <Area
                    type="monotone"
                    dataKey="matadero"
                    name="Matadero"
                    stackId="1"
                    stroke={COLORS.red[1]}
                    fill={COLORS.red[1]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña de Comparativa */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bovinos vs Porcinos</CardTitle>
              <CardDescription>Comparación de ingresos e impuestos por tipo de animal</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.animalComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Bovinos" fill={COLORS.blue[1]} />
                  <Bar dataKey="Porcinos" fill={COLORS.amber[1]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
