"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function GuiaForm({
  locations = [],
  contacts = [],
  products = [],
  tipoAnimal = undefined,
  guia = null,
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    numero_documento: guia?.numero_documento || "",
    fecha_documento: guia?.fecha_documento
      ? new Date(guia.fecha_documento).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    id_dueno_anterior: guia?.id_dueno_anterior?.toString() || "",
    id_dueno_nuevo: guia?.id_dueno_nuevo?.toString() || "",
    id_location: guia?.id_location?.toString() || "",
    observaciones: guia?.observaciones || "",
    tipo_animal: tipoAnimal || guia?.tipo_animal || "bovino",
    estado: guia?.estado || "borrador",
  })

  // Estado para las líneas de la guía
  const [lineas, setLineas] = useState(guia?.transaction_lines || [])
  const [nuevaLinea, setNuevaLinea] = useState({
    product_id: "",
    quantity: "",
    price: "",
    description: "",
  })

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
    if (!nuevaLinea.product_id || !nuevaLinea.quantity || !nuevaLinea.price) {
      toast({
        title: "Error",
        description: "Faltan campos requeridos en la línea",
        variant: "destructive",
      })
      return
    }

    // Añadir la nueva línea al estado
    const product = products.find((p) => p.id.toString() === nuevaLinea.product_id)
    const newLinea = {
      ...nuevaLinea,
      id: `temp-${Date.now()}`, // ID temporal para identificar en el frontend
      product_name: product?.nombre || "Producto",
      valor: Number(nuevaLinea.quantity) * Number(nuevaLinea.price),
      es_nueva: true,
    }

    setLineas([...lineas, newLinea])

    // Limpiar el formulario de nueva línea
    setNuevaLinea({
      product_id: "",
      quantity: "",
      price: "",
      description: "",
    })
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="numero_documento">Número de Guía</Label>
          <Input
            id="numero_documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_documento">Fecha</Label>
          <Input
            id="fecha_documento"
            name="fecha_documento"
            type="date"
            value={formData.fecha_documento}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_dueno_anterior">Dueño Anterior</Label>
          <Select
            value={formData.id_dueno_anterior}
            onValueChange={(value) => handleSelectChange("id_dueno_anterior", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un dueño anterior" />
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
        <div className="space-y-2">
          <Label htmlFor="id_dueno_nuevo">Dueño Nuevo</Label>
          <Select
            value={formData.id_dueno_nuevo}
            onValueChange={(value) => handleSelectChange("id_dueno_nuevo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un dueño nuevo" />
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
        <div className="space-y-2">
          <Label htmlFor="id_location">Ubicación</Label>
          <Select value={formData.id_location} onValueChange={(value) => handleSelectChange("id_location", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una ubicación" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  {location.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo_animal">Tipo de Animal</Label>
          <Select
            value={formData.tipo_animal}
            onValueChange={(value) => handleSelectChange("tipo_animal", value)}
            disabled={!!tipoAnimal}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bovino">Bovino</SelectItem>
              <SelectItem value="porcino">Porcino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Animales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="product_id">Producto</Label>
              <Select
                value={nuevaLinea.product_id}
                onValueChange={(value) => handleLineaSelectChange("product_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                value={nuevaLinea.quantity}
                onChange={handleLineaChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio Unitario</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={nuevaLinea.price}
                onChange={handleLineaChange}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleAddLinea} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay líneas agregadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  lineas.map((linea, index) => (
                    <TableRow key={linea.id || index}>
                      <TableCell>{linea.product_name || `Producto #${linea.product_id}`}</TableCell>
                      <TableCell>{linea.quantity}</TableCell>
                      <TableCell>{formatCurrency(linea.price)}</TableCell>
                      <TableCell>{formatCurrency(linea.valor)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLinea(index)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {lineas.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Total:
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(calcularTotal())}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/guias">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting || lineas.length === 0}>
          {isSubmitting ? "Guardando..." : guia ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

// Componente Table importado aquí para evitar errores
function Table({ children }) {
  return <table className="w-full">{children}</table>
}

function TableHeader({ children }) {
  return <thead>{children}</thead>
}

function TableBody({ children }) {
  return <tbody>{children}</tbody>
}

function TableRow({ children }) {
  return <tr>{children}</tr>
}

function TableHead({ children, className }) {
  return <th className={`p-2 text-left ${className}`}>{children}</th>
}

function TableCell({ children, className, colSpan }) {
  return (
    <td className={`p-2 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  )
}
