"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"

export default function GuiaForm({
  contacts = [],
  products = [],
  tipoAnimal = "bovino",
  locationId = 1,
  razas = [],
  colores = [],
  guia = null,
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ticketInputRef = useRef(null)

  // Colores según el tipo de animal
  const colors = tipoAnimal === "bovino" ? themeColors.bovino : themeColors.porcino

  const [formData, setFormData] = useState({
    numero_documento: guia?.numero_documento || "",
    fecha_documento: guia?.fecha_documento
      ? new Date(guia.fecha_documento).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    id_dueno_anterior: guia?.id_dueno_anterior?.toString() || "",
    id_dueno_nuevo: guia?.id_dueno_nuevo?.toString() || "",
    business_location_id: locationId.toString(),
  })

  // Estado para las líneas de la guía
  const [lineas, setLineas] = useState(guia?.transaction_lines || [])
  const [nuevaLinea, setNuevaLinea] = useState({
    ticket: "",
    product_id: "",
    kilos: "",
    raza_id: tipoAnimal === "porcino" ? "1" : "",
    color_id: tipoAnimal === "porcino" ? "6" : "",
  })

  // Obtener el precio del ticket del producto seleccionado
  const [precioTicket, setPrecioTicket] = useState(0)

  // Efecto para actualizar el precio del ticket cuando cambia el producto
  useEffect(() => {
    if (nuevaLinea.product_id) {
      const product = products.find((p) => p.id.toString() === nuevaLinea.product_id)
      setPrecioTicket(product ? product.price_ticket : 0)
    } else {
      setPrecioTicket(0)
    }
  }, [nuevaLinea.product_id, products])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLineaChange = (e) => {
    const { name, value } = e.target
    setNuevaLinea((prev) => ({ ...prev, [name]: value }))
  }

  const handleLineaSelectChange = (name, value) => {
    setNuevaLinea((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLinea = () => {
    // Validar datos requeridos
    if (
      !nuevaLinea.ticket ||
      !nuevaLinea.product_id ||
      !nuevaLinea.kilos ||
      !nuevaLinea.raza_id ||
      !nuevaLinea.color_id
    ) {
      toast({
        title: "Error",
        description: "Faltan campos requeridos en la línea",
        variant: "destructive",
      })
      return
    }

    // Obtener información del producto
    const product = products.find((p) => p.id.toString() === nuevaLinea.product_id)
    const raza = razas.find((r) => r.id.toString() === nuevaLinea.raza_id)
    const color = colores.find((c) => c.id.toString() === nuevaLinea.color_id)

    // Añadir la nueva línea al estado
    const newLinea = {
      ...nuevaLinea,
      id: `temp-${Date.now()}`, // ID temporal para identificar en el frontend
      product_name: product?.name || "Producto",
      raza_name: raza?.nombre || "Raza",
      color_name: color?.nombre || "Color",
      price_ticket: precioTicket,
      quantity: Number.parseFloat(nuevaLinea.kilos), // Para mantener compatibilidad con el modelo existente
      valor: precioTicket, // Usar solo el precio del ticket como valor, no multiplicar por kilos
      es_nueva: true,
    }

    setLineas([...lineas, newLinea])

    // Limpiar el formulario de nueva línea, manteniendo los valores predeterminados para porcinos
    // e incrementando automáticamente el número de ticket
    const nextTicket = Number.parseInt(nuevaLinea.ticket) + 1 || ""
    setNuevaLinea({
      ticket: nextTicket.toString(),
      product_id: "",
      kilos: "",
      raza_id: tipoAnimal === "porcino" ? "1" : "",
      color_id: tipoAnimal === "porcino" ? "6" : "",
    })

    // Enfocar el campo de ticket para facilitar la entrada de datos
    setTimeout(() => {
      if (ticketInputRef.current) {
        ticketInputRef.current.focus()
      }
    }, 0)
  }

  const handleDeleteLinea = (index) => {
    const nuevasLineas = [...lineas]
    nuevasLineas.splice(index, 1)
    setLineas(nuevasLineas)
  }

  const calcularTotal = () => {
    return lineas.reduce((total, linea) => total + (linea.valor || 0), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Aquí iría la lógica para guardar la guía
      const dataToSend = {
        ...formData,
        business_location_id: Number(formData.business_location_id),
        lineas: lineas,
      }
      toast({
        title: "Éxito",
        description: guia ? "Guía actualizada correctamente" : "Guía creada correctamente",
      })
      router.push("/guias")
    } catch (error) {
      console.error("Error al guardar la guía:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar la guía",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar tecla Enter para agregar línea
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddLinea()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección de información general - Reducida en tamaño y con colores pastel */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-lg"
        style={{
          backgroundColor: colors.light,
          border: `1px solid ${colors.medium}`,
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="numero_documento" className="text-sm">
            Número de Guía
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
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label htmlFor="id_dueno_anterior" className="text-sm">
            Dueño Anterior
          </Label>
          <Select
            value={formData.id_dueno_anterior}
            onValueChange={(value) => handleSelectChange("id_dueno_anterior", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione dueño anterior" />
            </SelectTrigger>
            <SelectContent>
              {contacts
                .filter((c) => c.type === 1 || c.type === 3)
                .map((contact) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.primer_nombre} {contact.primer_apellido} - {contact.nit}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 col-span-2 md:col-span-1">
          <Label htmlFor="id_dueno_nuevo" className="text-sm">
            Dueño Nuevo
          </Label>
          <Select
            value={formData.id_dueno_nuevo}
            onValueChange={(value) => handleSelectChange("id_dueno_nuevo", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione dueño nuevo" />
            </SelectTrigger>
            <SelectContent>
              {contacts
                .filter((c) => c.type === 2 || c.type === 3)
                .map((contact) => (
                  <SelectItem key={contact.id} value={contact.id.toString()}>
                    {contact.primer_nombre} {contact.primer_apellido} - {contact.nit}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de detalle de animales */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg" style={{ color: colors.text }}>
            Detalle de Animales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Ticket</th>
                  <th className="border p-2 text-left">Animal</th>
                  <th className="border p-2 text-left">Kilos</th>
                  <th className="border p-2 text-left">Raza</th>
                  <th className="border p-2 text-left">Color</th>
                  <th className="border p-2 text-left">Precio Ticket</th>
                  <th className="border p-2 text-left">Valor</th>
                  <th className="border p-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, index) => (
                  <tr key={linea.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border p-2">{linea.ticket}</td>
                    <td className="border p-2">{linea.product_name || `Producto #${linea.product_id}`}</td>
                    <td className="border p-2">{linea.quantity || linea.kilos}</td>
                    <td className="border p-2">{linea.raza_name || "N/A"}</td>
                    <td className="border p-2">{linea.color_name || "N/A"}</td>
                    <td className="border p-2">{formatCurrency(linea.price_ticket)}</td>
                    <td className="border p-2">{formatCurrency(linea.valor)}</td>
                    <td className="border p-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLinea(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="border p-2">
                    <Input
                      id="ticket"
                      name="ticket"
                      value={nuevaLinea.ticket}
                      onChange={handleLineaChange}
                      className="w-full"
                      placeholder="Nº Ticket"
                      onKeyDown={handleKeyDown}
                      ref={ticketInputRef}
                    />
                  </td>
                  <td className="border p-2">
                    <Select
                      value={nuevaLinea.product_id}
                      onValueChange={(value) => handleLineaSelectChange("product_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-2">
                    <Input
                      id="kilos"
                      name="kilos"
                      type="number"
                      step="0.01"
                      value={nuevaLinea.kilos}
                      onChange={handleLineaChange}
                      className="w-full"
                      placeholder="Kilos"
                      onKeyDown={handleKeyDown}
                    />
                  </td>
                  <td className="border p-2">
                    <Select
                      value={nuevaLinea.raza_id}
                      onValueChange={(value) => handleLineaSelectChange("raza_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {razas.map((raza) => (
                          <SelectItem key={raza.id} value={raza.id.toString()}>
                            {raza.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-2">
                    <Select
                      value={nuevaLinea.color_id}
                      onValueChange={(value) => handleLineaSelectChange("color_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {colores.map((color) => (
                          <SelectItem key={color.id} value={color.id.toString()}>
                            {color.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border p-2">
                    <Input value={formatCurrency(precioTicket)} disabled className="w-full bg-gray-50" />
                  </td>
                  <td className="border p-2">
                    <Input value={formatCurrency(precioTicket)} disabled className="w-full bg-gray-50" />
                  </td>
                  <td className="border p-2">
                    <Button
                      type="button"
                      onClick={handleAddLinea}
                      className="w-full"
                      style={{ backgroundColor: colors.medium, color: colors.text }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir
                    </Button>
                  </td>
                </tr>
                <tr className="font-bold" style={{ backgroundColor: colors.light }}>
                  <td colSpan={6} className="border p-2 text-right" style={{ color: colors.text }}>
                    Total:
                  </td>
                  <td className="border p-2" style={{ color: colors.text }}>
                    {formatCurrency(calcularTotal())}
                  </td>
                  <td className="border p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Presione Enter para agregar una nueva línea rápidamente</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/guias">Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || lineas.length === 0}
          style={{ backgroundColor: colors.dark, color: colors.text }}
        >
          {isSubmitting ? "Guardando..." : guia ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
