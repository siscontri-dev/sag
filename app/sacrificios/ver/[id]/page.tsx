import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTransactionById } from "@/lib/data"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, Printer } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function VerSacrificioPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const transaction = await getTransactionById(id)

  if (!transaction || transaction.type !== "exit") {
    notFound()
  }

  // Calcular totales
  const totalMachos = transaction.transaction_lines.reduce((sum, line) => sum + (line.quantity_m || 0), 0)
  const totalHembras = transaction.transaction_lines.reduce((sum, line) => sum + (line.quantity_h || 0), 0)
  const totalAnimales = totalMachos + totalHembras

  const pesoMachos = transaction.transaction_lines.reduce((sum, line) => sum + (line.peso_m || 0), 0)
  const pesoHembras = transaction.transaction_lines.reduce((sum, line) => sum + (line.peso_h || 0), 0)

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/sacrificios">Sacrificios</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Detalle de Sacrificio</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sacrificio #{transaction.numero_documento}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sacrificios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/sacrificios/editar/${transaction.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2">
              <dt className="text-sm font-medium text-muted-foreground">Fecha:</dt>
              <dd>{formatDate(transaction.fecha_documento)}</dd>

              <dt className="text-sm font-medium text-muted-foreground">Estado:</dt>
              <dd>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    transaction.estado === "confirmado"
                      ? "bg-green-100 text-green-800"
                      : transaction.estado === "anulado"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {transaction.estado === "confirmado"
                    ? "Confirmado"
                    : transaction.estado === "anulado"
                      ? "Anulado"
                      : "Borrador"}
                </span>
              </dd>

              <dt className="text-sm font-medium text-muted-foreground">Propietario:</dt>
              <dd>{transaction.dueno_anterior_nombre}</dd>

              <dt className="text-sm font-medium text-muted-foreground">Consignante:</dt>
              <dd>{transaction.consignante || "N/A"}</dd>

              <dt className="text-sm font-medium text-muted-foreground">Planilla:</dt>
              <dd>{transaction.planilla || "N/A"}</dd>

              <dt className="text-sm font-medium text-muted-foreground">Total:</dt>
              <dd className="font-bold">{formatCurrency(transaction.total)}</dd>

              <dt className="text-sm font-medium text-muted-foreground">Impuestos:</dt>
              <dd>
                {formatCurrency(
                  (transaction.impuesto1 || 0) + (transaction.impuesto2 || 0) + (transaction.impuesto3 || 0),
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumen de Animales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total Animales</p>
                <p className="text-2xl font-bold">{totalAnimales}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-800">Machos</p>
                <p className="text-2xl font-bold">{totalMachos}</p>
              </div>
              <div className="bg-pink-100 p-4 rounded-lg text-center">
                <p className="text-sm text-pink-800">Hembras</p>
                <p className="text-2xl font-bold">{totalHembras}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-sm text-green-800">Peso Total</p>
                <p className="text-2xl font-bold">
                  {transaction.transaction_lines
                    .reduce((sum, line) => sum + (line.quantity || 0), 0)
                    .toLocaleString("es-CO")}{" "}
                  kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Animales</CardTitle>
          <CardDescription>Líneas de sacrificio</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Machos</TableHead>
                <TableHead>Hembras</TableHead>
                <TableHead>Peso Total (kg)</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.transaction_lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>Producto #{line.product_id}</TableCell>
                  <TableCell>
                    {line.quantity_m || 0} ({line.peso_m?.toLocaleString("es-CO")} kg)
                  </TableCell>
                  <TableCell>
                    {line.quantity_h || 0} ({line.peso_h?.toLocaleString("es-CO")} kg)
                  </TableCell>
                  <TableCell>{line.quantity?.toLocaleString("es-CO")} kg</TableCell>
                  <TableCell>{line.numeros_tickets || "N/A"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.valor)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">
                  Total:
                </TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(transaction.total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
