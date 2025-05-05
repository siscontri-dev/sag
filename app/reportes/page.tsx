import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getReportData } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ReportesPage() {
  const reportData = await getReportData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <DatePickerWithRange />
      </div>

      <Tabs defaultValue="resumen" className="w-full">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="guias">Guías ICA</TabsTrigger>
          <TabsTrigger value="sacrificios">Sacrificios</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Guías</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalGuias}</div>
                <p className="text-xs text-muted-foreground">+{reportData.nuevasGuias} nuevas este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Sacrificios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalSacrificios}</div>
                <p className="text-xs text-muted-foreground">+{reportData.nuevosSacrificios} nuevos este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Kilos Procesados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalKilos.toLocaleString("es-CO")} kg</div>
                <p className="text-xs text-muted-foreground">
                  +{reportData.nuevosKilos.toLocaleString("es-CO")} kg este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalValor)}</div>
                <p className="text-xs text-muted-foreground">+{formatCurrency(reportData.nuevoValor)} este mes</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
                <CardDescription>Bovinos vs Porcinos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="w-full max-w-md">
                    <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(reportData.bovinosKilos / reportData.totalKilos) * 100}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <div className="mr-1 h-2 w-2 rounded-full bg-primary"></div>
                        <span>Bovinos ({Math.round((reportData.bovinosKilos / reportData.totalKilos) * 100)}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-1 h-2 w-2 rounded-full bg-secondary"></div>
                        <span>Porcinos ({Math.round((reportData.porcinosKilos / reportData.totalKilos) * 100)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>Kilos procesados por mes</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-muted-foreground">Gráfico de tendencia mensual</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guias">
          <Card>
            <CardHeader>
              <CardTitle>Guías ICA</CardTitle>
              <CardDescription>Listado detallado de guías</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Dueño Anterior</TableHead>
                    <TableHead>Dueño Nuevo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Kilos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.guias.map((guia) => (
                    <TableRow key={guia.id}>
                      <TableCell>{guia.numero_documento}</TableCell>
                      <TableCell>{new Date(guia.fecha_documento).toLocaleDateString()}</TableCell>
                      <TableCell>{guia.dueno_anterior_nombre}</TableCell>
                      <TableCell>{guia.dueno_nuevo_nombre}</TableCell>
                      <TableCell>{guia.tipo_animal || "N/A"}</TableCell>
                      <TableCell>{guia.kilos?.toLocaleString("es-CO")} kg</TableCell>
                      <TableCell className="text-right">{formatCurrency(guia.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sacrificios">
          <Card>
            <CardHeader>
              <CardTitle>Sacrificios</CardTitle>
              <CardDescription>Listado detallado de sacrificios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Machos</TableHead>
                    <TableHead>Hembras</TableHead>
                    <TableHead>Kilos</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.sacrificios.map((sacrificio) => (
                    <TableRow key={sacrificio.id}>
                      <TableCell>{sacrificio.numero_documento}</TableCell>
                      <TableCell>{new Date(sacrificio.fecha_documento).toLocaleDateString()}</TableCell>
                      <TableCell>{sacrificio.dueno_anterior_nombre}</TableCell>
                      <TableCell>{sacrificio.tipo_animal || "N/A"}</TableCell>
                      <TableCell>{sacrificio.machos || 0}</TableCell>
                      <TableCell>{sacrificio.hembras || 0}</TableCell>
                      <TableCell>{sacrificio.kilos?.toLocaleString("es-CO")} kg</TableCell>
                      <TableCell className="text-right">{formatCurrency(sacrificio.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contactos">
          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
              <CardDescription>Actividad por contacto</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>NIT/Cédula</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Guías</TableHead>
                    <TableHead>Sacrificios</TableHead>
                    <TableHead>Kilos</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.contactos.map((contacto) => (
                    <TableRow key={contacto.id}>
                      <TableCell>{contacto.nombre}</TableCell>
                      <TableCell>{contacto.nit}</TableCell>
                      <TableCell>
                        {contacto.type === 1 ? "Anterior" : contacto.type === 2 ? "Nuevo" : "Ambos"}
                      </TableCell>
                      <TableCell>{contacto.guias}</TableCell>
                      <TableCell>{contacto.sacrificios}</TableCell>
                      <TableCell>{contacto.kilos?.toLocaleString("es-CO")} kg</TableCell>
                      <TableCell className="text-right">{formatCurrency(contacto.valor)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
