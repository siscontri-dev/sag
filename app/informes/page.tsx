import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, FileText, Printer, MilkIcon as Cow, Scale } from "lucide-react"

export default function InformesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informe Diario Báscula Corralaje</CardTitle>
            <CardDescription>Resumen diario de tickets y valores para báscula y corralaje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/informes/bascula-corralaje">
                <FileText className="mr-2 h-4 w-4" />
                Ver Informe
              </Link>
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </CardFooter>
        </Card>

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
            <CardTitle>Báscula Diaria</CardTitle>
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
      </div>
    </div>
  )
}
