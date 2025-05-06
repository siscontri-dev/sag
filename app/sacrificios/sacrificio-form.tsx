"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { createSacrificio } from "./actions"
import PrintSacrificioDialog from "@/components/print-sacrificio-dialog"

export default function SacrificioForm({
  contactosAnteriores = [],
  contactosNuevos = [],
  tipoAnimal = "bovino",
  locationId = 1,
  impuestos = [],
  sacrificio = null,
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para el diálogo de impresión
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  // Colores según el tipo de animal
  const colors = tipoAnimal === "bovino" ? themeColors.bovino : themeColors.porcino

  const [formData, setFormData] = useState({
    numero_documento: sacrificio?.numero_documento || "",
    fecha_documento: sacrificio?.fecha_documento
      ? new Date(sacrificio.fecha_documento).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    id_dueno_anterior: sacrificio?.id_dueno_anterior?.toString() || "",
    id_dueno_nuevo: sacrificio?.id_dueno_nuevo?.toString() || "",
    business_location_id: locationId.toString(),
    estado: sacrificio?.estado || "confirmado", // Cambiado a confirmado por defecto
    cantidad_machos: sacrificio?.cantidad_machos?.toString() || "0",
    cantidad_hembras: sacrificio?.cantidad_hembras?.toString() || "0",
    total_kilos: sacrificio?.total_kilos?.toString() || "0",
    colors: sacrificio?.colors || "", // Cambiado a colors en lugar de colores
  })

  // Calcular totales
  const cantidadMachos = Number.parseInt(formData.cantidad_machos) || 0
  const cantidadHembras = Number.parseInt(formData.cantidad_hembras) || 0
  const totalAnimales = cantidadMachos + cantidadHembras
  const totalKilos = Number.parseInt(formData.total_kilos) || 0

  // Separar los impuestos por categoría
  const impuestosOficiales = impuestos.filter(
    (imp) => imp.nombre.toLowerCase().includes("degüello") || imp.nombre.toLowerCase().includes("fondo"),
  )

  const servicioMatadero = impuestos.filter((imp) => imp.nombre.toLowerCase().includes("matadero"))

  // Calcular valores de impuestos
  const impuestosOficialesCalculados = impuestosOficiales.map((impuesto) => {
    return {
      ...impuesto,
      valor_calculado: impuesto.valor * totalAnimales,
    }
  })

  const servicioMataderoCalculado = servicioMatadero.map((impuesto) => {
    return {
      ...impuesto,
      valor_calculado: impuesto.valor * totalAnimales,
    }
  })

  // Calcular subtotales y total general
  const subtotalOficial = impuestosOficialesCalculados.reduce((sum, imp) => sum + imp.valor_calculado, 0)
  const subtotalMatadero = servicioMataderoCalculado.reduce((sum, imp) => sum + imp.valor_calculado, 0)
  const totalGeneral = subtotalOficial + subtotalMatadero

  // Todos los impuestos calculados para enviar al servidor
  const todosImpuestosCalculados = [...impuestosOficialesCalculados, ...servicioMataderoCalculado]

  const handleChange = (e) => {
    const { name, value } = e.target

    // Para campos numéricos, solo permitir números
    if (name === "cantidad_machos" || name === "cantidad_hembras" || name === "total_kilos") {
      // Reemplazar cualquier carácter que no sea número
      const numericValue = value.replace(/[^0-9]/g, "")
      setFormData((prev) => ({ ...prev, [name]: numericValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Función para manejar la finalización de la impresión
  const handlePrintComplete = () => {
    // Redirigir a la página de sacrificios
    router.push("/sacrificios")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Preparar los datos para enviar
      const dataToSend = {
        ...formData,
        business_location_id: Number(formData.business_location_id),
        id_dueno_anterior: Number(formData.id_dueno_anterior),
        id_dueno_nuevo: Number(formData.id_dueno_nuevo),
        total: totalGeneral,
        estado: formData.estado || "confirmado",
        type: "exit",
        usuario_id: 1, // Usuario fijo mientras se desarrolla el login
        quantity_k: totalKilos, // Total de kilos
        quantity_m: cantidadMachos, // Cantidad de machos
        quantity_h: cantidadHembras, // Cantidad de hembras
        impuestos: todosImpuestosCalculados.map((imp) => ({
          impuesto_id: imp.id,
          valor: imp.valor,
          valor_calculado: imp.valor_calculado,
        })),
      }

      // Llamar a la acción del servidor para guardar
      const result = await createSacrificio(dataToSend)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Sacrificio creado correctamente",
        })

        // Mostrar el diálogo de impresión
        setShowPrintDialog(true)
      } else {
        throw new Error(result.message || "Error al guardar el sacrificio")
      }
    } catch (error) {
      console.error("Error al guardar el sacrificio:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al guardar el sacrificio",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección de información general */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-lg"
        style={{
          backgroundColor: colors.light,
          border: `1px solid ${colors.medium}`,
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="numero_documento" className="text-sm">
            Guía de Sacrificio
          </Label>
          <Input
            id="numero_documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            required
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fecha_documento" className="text-sm">
            Fecha
          </Label>
          <Input
            id="fecha_documento"
            name="fecha_documento"
            type="date"
            value={formData.fecha_documento}
            onChange={handleChange}
            required
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="business_location_id" className="text-sm">
            Ubicación
          </Label>
          <Input
            id="business_location_id"
            value={tipoAnimal === "bovino" ? "Bovinos" : "Porcinos"}
            disabled
            className="h-8 bg-gray-50"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="id_dueno_anterior" className="text-sm">
            Dueño Anterior
          </Label>
          <Select
            value={formData.id_dueno_anterior}
            onValueChange={(value) => handleSelectChange("id_dueno_anterior", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione dueño" />
            </SelectTrigger>
            <SelectContent>
              {contactosAnteriores.map((contact) => (
                <SelectItem key={contact.id} value={contact.id.toString()}>
                  {contact.primer_nombre} {contact.primer_apellido} - {contact.nit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="id_dueno_nuevo" className="text-sm">
            Dueño Nuevo
          </Label>
          <Select
            value={formData.id_dueno_nuevo}
            onValueChange={(value) => handleSelectChange("id_dueno_nuevo", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione dueño" />
            </SelectTrigger>
            <SelectContent>
              {contactosNuevos.map((contact) => (
                <SelectItem key={contact.id} value={contact.id.toString()}>
                  {contact.primer_nombre} {contact.primer_apellido} - {contact.nit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="estado" className="text-sm">
            Estado
          </Label>
          <Select value={formData.estado} onValueChange={(value) => handleSelectChange("estado", value)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sección de cantidades */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg" style={{ color: colors.text }}>
            Información del Sacrificio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cantidad_machos" className="text-sm">
                Cantidad Machos
              </Label>
              <Input
                id="cantidad_machos"
                name="cantidad_machos"
                type="text"
                inputMode="numeric"
                value={formData.cantidad_machos}
                onChange={handleChange}
                required
                className="h-8 text-center"
                placeholder="Ingrese cantidad"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cantidad_hembras" className="text-sm">
                Cantidad Hembras
              </Label>
              <Input
                id="cantidad_hembras"
                name="cantidad_hembras"
                type="text"
                inputMode="numeric"
                value={formData.cantidad_hembras}
                onChange={handleChange}
                required
                className="h-8 text-center"
                placeholder="Ingrese cantidad"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="total_kilos" className="text-sm">
                Total Kilos
              </Label>
              <Input
                id="total_kilos"
                name="total_kilos"
                type="text"
                inputMode="numeric"
                value={formData.total_kilos}
                onChange={handleChange}
                required
                className="h-8 text-center"
                placeholder="Ingrese kilos"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="colors" className="text-sm">
                Colores
              </Label>
              <Input
                id="colors"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                placeholder="Describa los colores"
                className="h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de impuestos */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
        <CardHeader className="py-3" style={{ backgroundColor: colors.light }}>
          <CardTitle className="text-lg" style={{ color: colors.text }}>
            Resumen del Sacrificio
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-800 font-medium">Total Animales</p>
                <p className="text-2xl font-bold text-blue-800">{totalAnimales}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-800 font-medium">Total Kilos</p>
                <p className="text-2xl font-bold text-purple-800">{totalKilos} kg</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg text-center">
                <p className="text-sm text-amber-800 font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalGeneral)}</p>
              </div>
            </div>

            {/* Liquidación oficial de impuesto */}
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="bg-green-50 p-3 border-b">
                <h3 className="font-medium text-green-800">Liquidación oficial de impuesto</h3>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Concepto</th>
                    <th className="border p-2 text-left">Valor Unitario</th>
                    <th className="border p-2 text-left">Cantidad</th>
                    <th className="border p-2 text-left">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {impuestosOficialesCalculados.map((impuesto, index) => (
                    <tr key={impuesto.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border p-2">{impuesto.nombre}</td>
                      <td className="border p-2">{formatCurrency(impuesto.valor)}</td>
                      <td className="border p-2">{totalAnimales}</td>
                      <td className="border p-2">{formatCurrency(impuesto.valor_calculado)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-medium">
                    <td className="border p-2" colSpan={3}>
                      Subtotal Impuestos
                    </td>
                    <td className="border p-2">{formatCurrency(subtotalOficial)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Servicio de matadero */}
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="bg-blue-50 p-3 border-b">
                <h3 className="font-medium text-blue-800">Servicio de matadero</h3>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-2 text-left">Concepto</th>
                    <th className="border p-2 text-left">Valor Unitario</th>
                    <th className="border p-2 text-left">Cantidad</th>
                    <th className="border p-2 text-left">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {servicioMataderoCalculado.map((impuesto, index) => (
                    <tr key={impuesto.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border p-2">{impuesto.nombre}</td>
                      <td className="border p-2">{formatCurrency(impuesto.valor)}</td>
                      <td className="border p-2">{totalAnimales}</td>
                      <td className="border p-2">{formatCurrency(impuesto.valor_calculado)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-medium">
                    <td className="border p-2" colSpan={3}>
                      Subtotal Servicio
                    </td>
                    <td className="border p-2">{formatCurrency(subtotalMatadero)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total general */}
            <div className="mt-4 p-3 bg-amber-100 rounded-lg flex justify-between items-center">
              <span className="font-bold text-amber-800 text-lg">TOTAL GENERAL</span>
              <span className="font-bold text-amber-800 text-xl">{formatCurrency(totalGeneral)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/sacrificios">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || totalAnimales === 0}
          style={{ backgroundColor: colors.dark, color: colors.text }}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* Diálogo para imprimir el documento */}
      <PrintSacrificioDialog
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        onComplete={handlePrintComplete}
        data={{
          numero_documento: formData.numero_documento,
          fecha_documento: formData.fecha_documento,
          dueno_anterior: {
            nombre:
              contactosAnteriores.find((c) => c.id.toString() === formData.id_dueno_anterior)?.primer_nombre +
                " " +
                contactosAnteriores.find((c) => c.id.toString() === formData.id_dueno_anterior)?.primer_apellido ||
              "N/A",
            nit: contactosAnteriores.find((c) => c.id.toString() === formData.id_dueno_anterior)?.nit || "N/A",
            direccion:
              contactosAnteriores.find((c) => c.id.toString() === formData.id_dueno_anterior)?.direccion || "N/A",
          },
          dueno_nuevo: {
            nombre:
              contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.primer_nombre +
                " " +
                contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.primer_apellido || "N/A",
            nit: contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.nit || "N/A",
            direccion: contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.direccion || "N/A",
          },
          cantidad_total: cantidadMachos + cantidadHembras,
          cantidad_machos: cantidadMachos,
          cantidad_hembras: cantidadHembras,
          total_kilos: totalKilos,
          colors: formData.colors,
          tipo_animal: tipoAnimal === "bovino" ? "BOVINO" : "PORCINO",
          impuestos: {
            deguello:
              impuestosOficialesCalculados.find((imp) => imp.nombre.toLowerCase().includes("degüello"))
                ?.valor_calculado || 0,
            fedegan:
              impuestosOficialesCalculados.find((imp) => imp.nombre.toLowerCase().includes("fondo"))?.valor_calculado ||
              0,
            otros: servicioMataderoCalculado.reduce((sum, imp) => sum + imp.valor_calculado, 0),
          },
          total: totalGeneral,
        }}
      />
    </form>
  )
}
