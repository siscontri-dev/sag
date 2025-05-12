"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Guia {
  id: string
  numero_documento: string
  fecha_documento: string
  propietario: string
  nit: string
  cantidad: number
  valor_total: number
  tipo_animal: string
}

export default function GuiasPorPropietario({ guias }: { guias: Guia[] }) {
  const [propietarios, setPropietarios] = useState<any[]>([])
  const [filtro, setFiltro] = useState("")
  const [propietariosFiltrados, setPropietariosFiltrados] = useState<any[]>([])

  useEffect(() => {
    // Agrupar guías por propietario
    const agruparPorPropietario = () => {
      const agrupados: Record<string, any> = {}

      guias.forEach((guia) => {
        if (!guia.propietario) return

        const propietarioKey = `${guia.propietario}-${guia.nit || "sin-nit"}`

        if (!agrupados[propietarioKey]) {
          agrupados[propietarioKey] = {
            propietario: guia.propietario,
            nit: guia.nit || "N/A",
            guias: [],
            totalGuias: 0,
            totalAnimales: 0,
            totalValor: 0,
          }
        }

        agrupados[propietarioKey].guias.push({
          id: guia.id,
          numero: guia.numero_documento,
          fecha: guia.fecha_documento ? new Date(guia.fecha_documento).toLocaleDateString("es-CO") : "N/A",
          cantidad: guia.cantidad || 0,
          valor: guia.valor_total || 0,
          tipo: guia.tipo_animal === "bovino" ? "Bovino" : "Porcino",
        })

        agrupados[propietarioKey].totalGuias += 1
        agrupados[propietarioKey].totalAnimales += guia.cantidad || 0
        agrupados[propietarioKey].totalValor += guia.valor_total || 0
      })

      // Convertir a array y ordenar por nombre de propietario
      return Object.values(agrupados).sort((a, b) => {
        return a.propietario.localeCompare(b.propietario)
      })
    }

    const propietariosAgrupados = agruparPorPropietario()
    setPropietarios(propietariosAgrupados)
    setPropietariosFiltrados(propietariosAgrupados)
  }, [guias])

  // Función para aplicar filtro
  const aplicarFiltro = () => {
    if (!filtro.trim()) {
      setPropietariosFiltrados(propietarios)
      return
    }

    const termino = filtro.toLowerCase()
    const filtrados = propietarios.filter(
      (p) => p.propietario.toLowerCase().includes(termino) || p.nit.toLowerCase().includes(termino),
    )
    setPropietariosFiltrados(filtrados)
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nombre o NIT..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && aplicarFiltro()}
            />
            <Button onClick={aplicarFiltro}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de propietarios */}
      {propietariosFiltrados.map((propietario, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-gray-50 py-3">
            <CardTitle className="text-lg flex justify-between">
              <span>{propietario.propietario}</span>
              <span className="text-gray-500">NIT: {propietario.nit}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 bg-gray-100 flex justify-between text-sm">
              <div>
                <span className="font-medium">Total Guías:</span> {propietario.totalGuias}
              </div>
              <div>
                <span className="font-medium">Total Animales:</span> {propietario.totalAnimales}
              </div>
              <div>
                <span className="font-medium">Valor Total:</span>{" "}
                {propietario.totalValor.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Guía</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propietario.guias.map((guia, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{guia.numero}</TableCell>
                    <TableCell>{guia.fecha}</TableCell>
                    <TableCell>{guia.tipo}</TableCell>
                    <TableCell className="text-right">{guia.cantidad}</TableCell>
                    <TableCell className="text-right">
                      {guia.valor.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {propietariosFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No se encontraron propietarios con los criterios de búsqueda.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
