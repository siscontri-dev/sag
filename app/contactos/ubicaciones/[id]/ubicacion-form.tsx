"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { createUbication } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { getMunicipiosByDepartamento } from "@/lib/data"

export default function UbicacionForm({ contactId, departamentos = [] }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [municipios, setMunicipios] = useState([])
  const [formData, setFormData] = useState({
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    nombre_finca: "",
    area_hectareas: "",
    es_principal: false,
  })

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (formData.id_departamento) {
      const fetchMunicipios = async () => {
        const data = await getMunicipiosByDepartamento(Number(formData.id_departamento))
        setMunicipios(data)
      }
      fetchMunicipios()
    } else {
      setMunicipios([])
    }
  }, [formData.id_departamento])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, es_principal: checked }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Crear un objeto FormData con los datos del formulario
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value.toString())
      })

      // Enviar los datos al servidor usando la Server Action
      const result = await createUbication(contactId, formDataObj)

      // Mostrar mensaje de éxito o error
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Ubicación añadida correctamente",
        })
        // Limpiar el formulario
        setFormData({
          direccion: "",
          id_departamento: "",
          id_municipio: "",
          nombre_finca: "",
          area_hectareas: "",
          es_principal: false,
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Hubo un problema al guardar la ubicación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al guardar la ubicación:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar la ubicación",
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
          <Label htmlFor="nombre_finca">Nombre de la Finca</Label>
          <Input id="nombre_finca" name="nombre_finca" value={formData.nombre_finca} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="area_hectareas">Área (Hectáreas)</Label>
          <Input
            id="area_hectareas"
            name="area_hectareas"
            type="number"
            step="0.01"
            value={formData.area_hectareas}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="direccion">Dirección</Label>
          <Textarea
            id="direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            required
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_departamento">Departamento</Label>
          <Select
            value={formData.id_departamento}
            onValueChange={(value) => handleSelectChange("id_departamento", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos.map((departamento) => (
                <SelectItem key={departamento.id} value={departamento.id.toString()}>
                  {departamento.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="id_municipio">Municipio</Label>
          <Select
            value={formData.id_municipio}
            onValueChange={(value) => handleSelectChange("id_municipio", value)}
            disabled={!formData.id_departamento || municipios.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione un municipio" />
            </SelectTrigger>
            <SelectContent>
              {municipios.map((municipio) => (
                <SelectItem key={municipio.id} value={municipio.id.toString()}>
                  {municipio.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="es_principal" checked={formData.es_principal} onCheckedChange={handleCheckboxChange} />
          <Label htmlFor="es_principal">Ubicación Principal</Label>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Añadir Ubicación"}
        </Button>
      </div>
    </form>
  )
}
