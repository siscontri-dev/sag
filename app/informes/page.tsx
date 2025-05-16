import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Printer, MilkIcon as Cow, Scale, ClipboardList } from "lucide-react"

export default function InformesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Boletín Movimiento Ganado Mayor</CardTitle>
            <CardDescription>Registro de sacrificios de ganado bovino y distribución de impuestos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Cow className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/informes/boletin-ganado-mayor">
                <FileText className="mr-2 h-4 w-4" />
                Ver Boletín
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/informes/boletin-ganado-mayor">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Boletín Movimiento Ganado Menor</CardTitle>
            <CardDescription>Registro de sacrificios de ganado porcino y distribución de impuestos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <ClipboardList className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/informes/boletin-ganado-menor">
                <FileText className="mr-2 h-4 w-4" />
                Ver Boletín
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/informes/boletin-ganado-menor">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báscula Diaria - Porcinos</CardTitle>
            <CardDescription>Informe diario de báscula para porcinos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Scale className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria">
                <FileText className="mr-2 h-4 w-4" />
                Ver Informe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báscula Diaria - Bovinos</CardTitle>
            <CardDescription>Informe diario de báscula para bovinos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Cow className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria-bovinos">
                <FileText className="mr-2 h-4 w-4" />
                Ver Informe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria-bovinos">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Báscula Diaria Integrada</CardTitle>
            <CardDescription>Informe integrado de báscula diaria para bovinos y porcinos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Scale className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria-integrada">
                <FileText className="mr-2 h-4 w-4" />
                Ver Informe
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/bascula-diaria-integrada">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Boletín Movimiento Bovinos</CardTitle>
            <CardDescription>Registro detallado de movimientos de bovinos y valores de impuestos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Cow className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/boletin-movimiento-bovinos">
                <FileText className="mr-2 h-4 w-4" />
                Ver Boletín
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/boletin-movimiento-bovinos">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Boletín Movimiento Porcinos</CardTitle>
            <CardDescription>Registro detallado de movimientos de porcinos y valores de impuestos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <ClipboardList className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/boletin-movimiento-porcinos">
                <FileText className="mr-2 h-4 w-4" />
                Ver Boletín
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/boletin-movimiento-porcinos">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
