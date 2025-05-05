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
import { PlusCircle, Trash, Loader2, Printer } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { createGuia, updateGuia } from "./actions"
// Añadir las importaciones de los componentes de impresión
import TicketPrinter from "@/components/ticket-printer"
import BulkTicketPrinter from "@/components/bulk-ticket-printer"

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

  // Estado para validación de campos
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    ticket: false,
    product_id: false,
    kilos: false,
    raza_id: false,
    color_id: false,
  })

  // Estado para el diálogo de impresión de tickets
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [ticketsToPrint, setTicketsToPrint] = useState([])

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
    estado: guia?.estado || "confirmado",
  })

  // Estado para las líneas de la guía
  const [lineas, setLineas] = useState(
    guia?.transaction_lines?.map((line) => ({
      ...line,
      product_name: products.find((p) => p.id === line.product_id)?.name || `Producto #${line.product_id}`,
      raza_name: razas.find((r) => r.id === line.raza_id)?.nombre || "N/A",
      color_name: colores.find((c) => c.id === line.color_id)?.nombre || "N/A",
      es_macho: line.es_macho || false,
    })) || [],
  )

  const [nuevaLinea, setNuevaLinea] = useState({
    ticket: "",
    product_id: "",
    kilos: "",
    raza_id: tipoAnimal === "porcino" ? "1" : "",
    color_id: tipoAnimal === "porcino" ? "6" : "",
    es_macho: false,
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

    // Limpiar el error de validación para este campo si se está completando
    if (validationErrors[name] && value) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: false,
      }))
    }
  }

  const handleLineaSelectChange = (name, value) => {
    setNuevaLinea((prev) => ({ ...prev, [name]: value }))

    // Limpiar el error de validación para este campo si se está completando
    if (validationErrors[name] && value) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: false,
      }))
    }
  }

  const handleCheckboxChange = (checked) => {
    setNuevaLinea((prev) => ({ ...prev, es_macho: checked }))
  }

  const validateLineaFields = () => {
    // Si solo tenemos el número de ticket y nada más, no validamos los otros campos
    // Esto permite generar un ticket automático sin tener que completar todos los campos
    if (
      nuevaLinea.ticket &&
      !nuevaLinea.product_id &&
      !nuevaLinea.kilos &&
      !nuevaLinea.raza_id &&
      !nuevaLinea.color_id
    ) {
      return false // No validamos, pero tampoco permitimos añadir la línea
    }

    const errors = {
      ticket: !nuevaLinea.ticket,
      product_id: !nuevaLinea.product_id,
      kilos: !nuevaLinea.kilos,
      raza_id: !nuevaLinea.raza_id,
      color_id: !nuevaLinea.color_id,
    }

    setValidationErrors(errors)
    setValidationAttempted(true)

    return !Object.values(errors).some((error) => error)
  }

  const handleAddLinea = () => {
    // Validar datos requeridos
    if (!validateLineaFields()) {
      // Si solo tenemos el ticket y nada más, no mostramos error
      if (
        nuevaLinea.ticket &&
        !nuevaLinea.product_id &&
        !nuevaLinea.kilos &&
        !nuevaLinea.raza_id &&
        !nuevaLinea.color_id
      ) {
        return // Simplemente no hacemos nada
      }

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
      es_macho: false,
    })

    // Resetear la validación
    setValidationAttempted(false)
    setValidationErrors({
      ticket: false,
      product_id: false,
      kilos: false,
      raza_id: false,
      color_id: false,
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

  // Calcular totales
  const calcularTotales = () => {
    let totalMachos = 0
    let totalHembras = 0
    let totalKilos = 0
    let totalValor = 0

    lineas.forEach((linea) => {
      const kilos = Number(linea.kilos || linea.quantity || 0)
      totalKilos += kilos
      totalValor += Number(linea.valor || 0)

      if (linea.es_macho) {
        totalMachos += 1 // Contar cada línea de macho como 1 animal
      } else {
        totalHembras += 1 // Contar cada línea de hembra como 1 animal
      }
    })

    return {
      totalMachos,
      totalHembras,
      totalAnimales: totalMachos + totalHembras,
      totalKilos,
      totalValor,
    }
  }

  const totales = calcularTotales()

  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false)

  const generateTicket = async () => {
    try {
      setIsGeneratingTicket(true)
      // Obtener el ID de ubicación del formulario
      const locationId = Number(formData.business_location_id)

      const response = await fetch(`/api/tickets/next/${locationId}`)

      if (!response.ok) {
        throw new Error("Error al generar el ticket")
      }

      const data = await response.json()
      console.log("Ticket generado en guía:", data)

      // Actualizar el campo de ticket en la nueva línea
      setNuevaLinea((prev) => ({
        ...prev,
        ticket: data.ticket.toString(),
      }))

      toast({
        title: "Ticket generado",
        description: `Ticket #${data.ticket} generado correctamente`,
      })
    } catch (error) {
      console.error("Error al generar ticket:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el ticket automáticamente: " + (error.message || "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setIsGeneratingTicket(false)
    }
  }

  // Función para preparar los tickets para imprimir
  const prepareTicketsForPrinting = () => {
    // Obtener el dueño anterior
    const duenioAnterior = contacts.find((c) => c.id.toString() === formData.id_dueno_anterior)

    // Crear un array de datos de tickets a partir de las líneas
    const tickets = lineas.map((linea) => ({
      ticketNumber: Number(linea.ticket),
      fecha: new Date().toLocaleString("es-CO"),
      duenioAnterior: duenioAnterior ? `${duenioAnterior.primer_nombre} ${duenioAnterior.primer_apellido}` : "N/A",
      cedulaDuenio: duenioAnterior ? duenioAnterior.nit : "N/A",
      tipoAnimal: tipoAnimal,
      sku: linea.product_name || `Producto #${linea.product_id}`,
      pesoKg: Number(linea.quantity || linea.kilos || 0),
      raza: linea.raza_name || "N/A",
      color: linea.color_name || "N/A",
      genero: linea.es_macho ? "MACHO" : "HEMBRA",
    }))

    return tickets
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Calcular totales de machos y hembras
      const totalMachos = lineas.filter((linea) => linea.es_macho).length
      const totalHembras = lineas.filter((linea) => !linea.es_macho).length
      const totalKilos = lineas.reduce((sum, linea) => sum + Number(linea.kilos || linea.quantity || 0), 0)

      // Preparar los datos para enviar
      const dataToSend = {
        ...formData,
        business_location_id: Number(formData.business_location_id),
        id_dueno_anterior: Number(formData.id_dueno_anterior),
        id_dueno_nuevo: Number(formData.id_dueno_nuevo),
        total: totales.totalValor,
        estado: formData.estado || "confirmado",
        type: "entry",
        usuario_id: 1, // Usuario fijo mientras se desarrolla el login
        quantity_m: totalMachos, // Cantidad de animales machos
        quantity_h: totalHembras, // Cantidad de animales hembras
        quantity_k: totalKilos, // Total de kilos
        lineas: lineas.map((linea) => ({
          ticket: Number(linea.ticket),
          product_id: Number(linea.product_id),
          quantity: Number(linea.kilos || linea.quantity),
          // Asegurar que raza_id y color_id sean valores válidos
          raza_id: Number(linea.raza_id) || (tipoAnimal === "porcino" ? 1 : null),
          color_id: Number(linea.color_id) || (tipoAnimal === "porcino" ? 6 : null),
          valor: Number(linea.valor),
          // No incluimos es_macho ya que no existe en la tabla
        })),
      }

      let result

      // Llamar a la acción del servidor para guardar o actualizar
      if (guia) {
        result = await updateGuia(guia.id, dataToSend)
      } else {
        result = await createGuia(dataToSend)
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: guia ? "Guía actualizada correctamente" : "Guía creada correctamente",
        })

        // Preparar los tickets para imprimir
        const tickets = prepareTicketsForPrinting()
        setTicketsToPrint(tickets)

        // Mostrar el diálogo de impresión
        setShowPrintDialog(true)
      } else {
        throw new Error(result.message || "Error al guardar la guía")
      }
    } catch (error) {
      console.error("Error al guardar la guía:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al guardar la guía",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  // Función para manejar la finalización de la impresión
  const handlePrintComplete = () => {
    // Redirigir a la página de guías
    router.push("/guias")
  }

  // Manejar tecla Enter para agregar línea
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddLinea()
    }
  }

  // Función para imprimir tickets sin guardar la guía
  const printTicketsOnly = () => {
    // Preparar los tickets para imprimir
    const tickets = prepareTicketsForPrinting()
    setTicketsToPrint(tickets)

    // Mostrar el diálogo de impresión
    setShowPrintDialog(true)
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
                  <th className="border p-2 text-left" style={{ width: "15%" }}>
                    Ticket
                  </th>
                  <th className="border p-2 text-left" style={{ width: "25%" }}>
                    Animal
                  </th>
                  <th className="border p-2 text-left" style={{ width: "8%" }}>
                    Kilos
                  </th>
                  <th className="border p-2 text-left" style={{ width: "12%" }}>
                    Raza
                  </th>
                  <th className="border p-2 text-left" style={{ width: "12%" }}>
                    Color
                  </th>
                  <th className="border p-2 text-left" style={{ width: "10%" }}>
                    Precio Ticket
                  </th>
                  <th className="border p-2 text-left" style={{ width: "10%" }}>
                    Macho
                  </th>
                  <th className="border p-2 text-left" style={{ width: "8%" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Modificar la sección donde se muestran las líneas existentes: */}
                {lineas.map((linea, index) => (
                  <tr key={linea.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border p-2">{linea.ticket}</td>
                    <td className="border p-2">{linea.product_name || `Producto #${linea.product_id}`}</td>
                    <td className="border p-2">{linea.quantity || linea.kilos}</td>
                    <td className="border p-2">{linea.raza_name || "N/A"}</td>
                    <td className="border p-2">{linea.color_name || "N/A"}</td>
                    <td className="border p-2">{formatCurrency(linea.price_ticket || linea.valor)}</td>
                    <td className="border p-2">{linea.es_macho ? "Sí" : "No"}</td>
                    <td className="border p-2">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLinea(index)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                        <TicketPrinter
                          ticketData={{
                            ticketNumber: Number(linea.ticket),
                            fecha: new Date().toLocaleString("es-CO"),
                            duenioAnterior:
                              contacts.find((c) => c.id.toString() === formData.id_dueno_anterior)?.primer_nombre +
                                " " +
                                contacts.find((c) => c.id.toString() === formData.id_dueno_anterior)?.primer_apellido ||
                              "N/A",
                            cedulaDuenio:
                              contacts.find((c) => c.id.toString() === formData.id_dueno_anterior)?.nit || "N/A",
                            tipoAnimal: tipoAnimal,
                            sku: linea.product_name || `Producto #${linea.product_id}`,
                            pesoKg: Number(linea.quantity || linea.kilos || 0),
                            raza: linea.raza_name || "N/A",
                            color: linea.color_name || "N/A",
                            genero: linea.es_macho ? "MACHO" : "HEMBRA",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <Input
                        id="ticket"
                        name="ticket"
                        value={nuevaLinea.ticket}
                        onChange={handleLineaChange}
                        className={`w-full ${validationAttempted && validationErrors.ticket ? "border-red-500" : ""}`}
                        placeholder="Nº Ticket"
                        onKeyDown={handleKeyDown}
                        ref={ticketInputRef}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateTicket}
                        disabled={isGeneratingTicket}
                        className="whitespace-nowrap px-2"
                      >
                        {isGeneratingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : "A"}
                      </Button>
                    </div>
                  </td>
                  <td className="border p-2">
                    <Select
                      value={nuevaLinea.product_id}
                      onValueChange={(value) => handleLineaSelectChange("product_id", value)}
                    >
                      <SelectTrigger
                        className={validationAttempted && validationErrors.product_id ? "border-red-500" : ""}
                      >
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
                      className={`w-full ${validationAttempted && validationErrors.kilos ? "border-red-500" : ""}`}
                      placeholder="Kilos"
                      onKeyDown={handleKeyDown}
                    />
                  </td>
                  <td className="border p-2">
                    <Select
                      value={nuevaLinea.raza_id}
                      onValueChange={(value) => handleLineaSelectChange("raza_id", value)}
                    >
                      <SelectTrigger
                        className={validationAttempted && validationErrors.raza_id ? "border-red-500" : ""}
                      >
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
                      <SelectTrigger
                        className={validationAttempted && validationErrors.color_id ? "border-red-500" : ""}
                      >
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
                  <td className="border p-2 text-center">
                    <input
                      type="checkbox"
                      checked={nuevaLinea.es_macho}
                      onChange={(e) => handleCheckboxChange(e.target.checked)}
                      className="h-4 w-4"
                    />
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
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Presione Enter para agregar una nueva línea rápidamente</p>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de totales */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-1" style={{ backgroundColor: colors.dark }}></div>
        <CardHeader className="py-3" style={{ backgroundColor: colors.light }}>
          <CardTitle className="text-lg" style={{ color: colors.text }}>
            Resumen de la Guía
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-800 font-medium">Total Animales</p>
              <p className="text-2xl font-bold text-blue-800">{totales.totalAnimales}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-800 font-medium">Machos</p>
              <p className="text-2xl font-bold text-green-800">{totales.totalMachos}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg text-center">
              <p className="text-sm text-pink-800 font-medium">Hembras</p>
              <p className="text-2xl font-bold text-pink-800">{totales.totalHembras}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-purple-800 font-medium">Total Kilos</p>
              <p className="text-2xl font-bold text-purple-800">{totales.totalKilos.toFixed(2)} kg</p>
            </div>
            <div className="col-span-2 md:col-span-4 bg-amber-50 p-4 rounded-lg text-center">
              <p className="text-sm text-amber-800 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-amber-800">{formatCurrency(totales.totalValor)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-2">
        <Button variant="outline" type="button" onClick={printTicketsOnly} disabled={lineas.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Solo Imprimir Tickets
        </Button>

        <div className="flex gap-2">
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
      </div>

      {/* Diálogo para imprimir tickets */}
      <BulkTicketPrinter
        tickets={ticketsToPrint}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        onComplete={handlePrintComplete}
      />
    </form>
  )
}
