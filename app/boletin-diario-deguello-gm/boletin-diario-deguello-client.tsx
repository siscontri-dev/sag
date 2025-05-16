"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateRangePicker } from "@/components/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DownloadIcon, FileSpreadsheetIcon, PrinterIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { PrintBoletinDiarioDeguelloDialog } from "@/components/print-boletin-diario-deguello-dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function BoletinDiarioDeguelloClient() {
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  })
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [totals, setTotals] = useState({
    totalAnimales: 0,
    totalKilos: 0,
    totalDeguello: 0,
    totalBascula: 0,
    totalFomento: 0,
    totalIca: 0,
    totalTotal: 0,
  })

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchData()
    }
  }, [dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      const response = await fetch(`/api/boletin-diario-deguello-gm?from=${fromDate}&to=${toDate}`)

      if (!response.ok) {
        throw new Error("Error al cargar los datos")
      }

      const result = await response.json()
      setData(result.data || [])

      // Calcular totales
      if (result.data && result.data.length > 0) {
        const calculatedTotals = result.data.reduce(
          (acc: any, item: any) => {
            return {
              totalAnimales: acc.totalAnimales + Number(item.cantidad || 0),
              totalKilos: acc.totalKilos + Number(item.kilos || 0),
              totalDeguello: acc.totalDeguello + Number(item.deguello || 0),
              totalBascula: acc.totalBascula + Number(item.bascula || 0),
              totalFomento: acc.totalFomento + Number(item.fomento || 0),
              totalIca: acc.totalIca + Number(item.ica || 0),
              totalTotal: acc.totalTotal + Number(item.total || 0),
            }
          },
          {
            totalAnimales: 0,
            totalKilos: 0,
            totalDeguello: 0,
            totalBascula: 0,
            totalFomento: 0,
            totalIca: 0,
            totalTotal: 0,
          },
        )

        setTotals(calculatedTotals)
      } else {
        setTotals({
          totalAnimales: 0,
          totalKilos: 0,
          totalDeguello: 0,
          totalBascula: 0,
          totalFomento: 0,
          totalIca: 0,
          totalTotal: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      window.open(`/api/export/boletin-diario-deguello-gm/excel?from=${fromDate}&to=${toDate}`, "_blank")
    } catch (error) {
      console.error("Error exporting to Excel:", error)
    }
  }

  const handleExportPDF = async () => {
    try {
      const fromDate = format(dateRange.from, "yyyy-MM-dd")
      const toDate = format(dateRange.to, "yyyy-MM-dd")

      window.open(`/api/export/boletin-diario-deguello-gm/pdf?from=${fromDate}&to=${toDate}`, "_blank")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
    }
  }

  const handlePrint = () => {
    setShowPrintDialog(true)
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-bold">Boletín Diario Deguello Ganado Mayor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportExcel} disabled={loading || data.length === 0}>
                <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" onClick={handleExportPDF} disabled={loading || data.length === 0}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={loading || data.length === 0}>
                <PrinterIcon className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Fecha</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Cantidad</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Kilos</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Degüello</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Báscula</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Fomento</TableHead>
                    <TableHead className="whitespace-nowrap text-right">ICA</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        {item.fecha ? format(new Date(item.fecha), "dd/MM/yyyy", { locale: es }) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">{item.cantidad || 0}</TableCell>
                      <TableCell className="text-right">
                        {item.kilos ? Number(item.kilos).toLocaleString("es-CO") : "0"}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.deguello || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.bascula || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.fomento || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.ica || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total || 0)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>TOTALES</TableCell>
                    <TableCell className="text-right">{totals.totalAnimales}</TableCell>
                    <TableCell className="text-right">{totals.totalKilos.toLocaleString("es-CO")}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalDeguello)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalBascula)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalFomento)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalIca)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.totalTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No hay datos disponibles para el rango de fechas seleccionado.
            </div>
          )}
        </CardContent>
      </Card>

      {showPrintDialog && (
        <PrintBoletinDiarioDeguelloDialog
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          data={data}
          dateRange={dateRange}
          totals={totals}
        />
      )}
    </>
  )
}
