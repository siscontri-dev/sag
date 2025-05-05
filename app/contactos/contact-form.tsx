"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createContact, updateContact } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Trash, Loader2, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ContactForm({ departamentos = [], contact = null, ubicaciones = [] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("informacion")
  const [formData, setFormData] = useState({
    primer_nombre: contact?.primer_nombre || "",
    segundo_nombre: contact?.segundo_nombre || "",
    primer_apellido: contact?.primer_apellido || "",
    segundo_apellido: contact?.segundo_apellido || "",
    nit: contact?.nit || "",
    telefono: contact?.telefono || "",
    email: contact?.email || "",
    type: contact?.type?.toString() || "1",
    business_location_id: contact?.business_location_id?.toString() || "1",
  })

  // Estado para las ubicaciones
  const [ubicacionesState, setUbicacionesState] = useState(ubicaciones || [])
  const [nuevaUbicacion, setNuevaUbicacion] = useState({
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    nombre_finca: "",
    area_hectareas: "",
    es_principal: false,
  })
  const [municipios, setMunicipios] = useState([])
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const [ubicacionToDelete, setUbicacionToDelete] = useState(null)
  const [ubicacionesNuevas, setUbicacionesNuevas] = useState([])
  const [ubicacionesEliminadas, setUbicacionesEliminadas] = useState([])
  const [errorMunicipios, setErrorMunicipios] = useState("")
  const [apiResponse, setApiResponse] = useState(null)

  // Función para cargar municipios usando exclusivamente la API
  const fetchMunicipiosFromAPI = async (departamentoId) => {
    setLoadingMunicipios(true)
    setErrorMunicipios("")
    setApiResponse(null)

    try {
      console.log(`Solicitando municipios para departamento ID: ${departamentoId} vía API`)

      const response = await fetch(`/api/municipios/${departamentoId}`)
      const data = await response.json()

      // Guardar la respuesta completa para diagnóstico
      setApiResponse(data)

      if (!response.ok) {
        throw new Error(data.error || `Error HTTP: ${response.status}`)
      }

      if (!data.municipios || !Array.isArray(data.municipios)) {
        throw new Error("Formato de respuesta inválido")
      }

      console.log(`Municipios recibidos: ${data.municipios.length}`)

      if (data.municipios.length === 0) {
        setErrorMunicipios(`No se encontraron municipios para este departamento (ID: ${departamentoId})`)
      }

      setMunicipios(data.municipios)
      return data.municipios
    } catch (error) {
      console.error("Error al cargar municipios:", error)
      setErrorMunicipios(`Error al cargar municipios: ${error.message}`)
      setMunicipios([])
      return []
    } finally {
      setLoadingMunicipios(false)
    }
  }

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (nuevaUbicacion.id_departamento) {
      fetchMunicipiosFromAPI(Number(nuevaUbicacion.id_departamento))
    } else {
      setMunicipios([])
      setApiResponse(null)
    }
  }, [nuevaUbicacion.id_departamento])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUbicacionChange = (e) => {
    const { name, value } = e.target
    setNuevaUbicacion((prev) => ({ ...prev, [name]: value }))
  }

  const handleUbicacionSelectChange = (name, value) => {
    setNuevaUbicacion((prev) => ({ ...prev, [name]: value }))

    // Si estamos cambiando el departamento, resetear el municipio
    if (name === "id_departamento") {
      setNuevaUbicacion((prev) => ({ ...prev, id_municipio: "" }))
    }
  }

  const handleUbicacionCheckboxChange = (checked) => {
    setNuevaUbicacion((prev) => ({ ...prev, es_principal: checked }))
  }

  const handleAddUbicacion = () => {
    // Validar datos requeridos
    if (
      !nuevaUbicacion.direccion ||
      !nuevaUbicacion.id_departamento ||
      !nuevaUbicacion.id_municipio ||
      !nuevaUbicacion.nombre_finca
    ) {
      toast({
        title: "Error",
        description: "Faltan campos requeridos en la ubicación",
        variant: "destructive",
      })
      return
    }

    // Obtener nombres de departamento y municipio
    const departamento = departamentos.find((d) => d.id.toString() === nuevaUbicacion.id_departamento)
    const municipio = municipios.find((m) => m.id.toString() === nuevaUbicacion.id_municipio)

    // Añadir la nueva ubicación al estado
    const newUbicacion = {
      ...nuevaUbicacion,
      id: `temp-${Date.now()}`, // ID temporal para identificar en el frontend
      departamento_nombre: departamento?.nombre || "Departamento desconocido",
      municipio_nombre: municipio?.nombre || "Municipio desconocido",
      es_nueva: true,
    }

    // Guardar la ubicación en el estado
    const nuevaUbicacionParaGuardar = {
      ...nuevaUbicacion,
      id_departamento: Number(nuevaUbicacion.id_departamento),
      id_municipio: Number(nuevaUbicacion.id_municipio),
      area_hectareas: nuevaUbicacion.area_hectareas ? Number(nuevaUbicacion.area_hectareas) : null,
    }

    setUbicacionesNuevas([...ubicacionesNuevas, nuevaUbicacionParaGuardar])
    setUbicacionesState([...ubicacionesState, newUbicacion])

    // Limpiar el formulario de nueva ubicación
    setNuevaUbicacion({
      direccion: "",
      id_departamento: "",
      id_municipio: "",
      nombre_finca: "",
      area_hectareas: "",
      es_principal: false,
    })

    toast({
      title: "Ubicación añadida",
      description: "La ubicación se ha añadido correctamente a la lista",
    })
  }

  const handleDeleteUbicacion = (ubicacion) => {
    if (ubicacion.es_nueva) {
      // Si es una ubicación nueva (no guardada en BD), simplemente la quitamos del estado
      setUbicacionesState(ubicacionesState.filter((u) => u.id !== ubicacion.id))
      setUbicacionesNuevas(ubicacionesNuevas.filter((u) => u.id !== ubicacion.id))
    } else {
      // Si es una ubicación existente, la marcamos para eliminar
      setUbicacionesEliminadas([...ubicacionesEliminadas, ubicacion.id])
      setUbicacionesState(ubicacionesState.filter((u) => u.id !== ubicacion.id))
    }
    setUbicacionToDelete(null)

    toast({
      title: "Ubicación eliminada",
      description: "La ubicación se ha eliminado de la lista",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Crear un objeto FormData con los datos del formulario
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Añadir las ubicaciones nuevas y eliminadas
      formDataObj.append("ubicacionesNuevas", JSON.stringify(ubicacionesNuevas))
      formDataObj.append("ubicacionesEliminadas", JSON.stringify(ubicacionesEliminadas))

      console.log("Enviando datos del formulario:", {
        contacto: Object.fromEntries(formDataObj.entries()),
        ubicacionesNuevas: ubicacionesNuevas,
        ubicacionesEliminadas: ubicacionesEliminadas,
      })

      // Enviar los datos al servidor usando la Server Action
      let result
      if (contact) {
        result = await updateContact(contact.id, formDataObj)
      } else {
        result = await createContact(formDataObj)
      }

      console.log("Resultado de la operación:", result)

      // Mostrar mensaje de éxito o error
      if (!result || !result.success) {
        toast({
          title: "Error",
          description: result?.message || "Hubo un problema al guardar el contacto",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Éxito",
          description: contact ? "Contacto actualizado correctamente" : "Contacto creado correctamente",
        })
        router.push("/contactos")
      }
    } catch (error) {
      console.error("Error al guardar el contacto:", error)
      toast({
        title: "Error",
        description: `Hubo un problema al guardar el contacto: ${error.message || "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="informacion">Información Personal</TabsTrigger>
          <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primer_nombre">Primer Nombre</Label>
              <Input
                id="primer_nombre"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
              <Input
                id="segundo_nombre"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primer_apellido">Primer Apellido</Label>
              <Input
                id="primer_apellido"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
              <Input
                id="segundo_apellido"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nit">NIT/Cédula</Label>
              <Input id="nit" name="nit" value={formData.nit} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Contacto</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dueño Anterior</SelectItem>
                  <SelectItem value="2">Dueño Nuevo</SelectItem>
                  <SelectItem value="3">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ubicaciones" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Añadir Nueva Ubicación</CardTitle>
              <CardDescription>Ingrese los datos de la ubicación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre_finca">Nombre de la Ubicación</Label>
                  <Input
                    id="nombre_finca"
                    name="nombre_finca"
                    value={nuevaUbicacion.nombre_finca}
                    onChange={handleUbicacionChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area_hectareas">Área (Hectáreas)</Label>
                  <Input
                    id="area_hectareas"
                    name="area_hectareas"
                    type="number"
                    step="0.01"
                    value={nuevaUbicacion.area_hectareas}
                    onChange={handleUbicacionChange}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    name="direccion"
                    value={nuevaUbicacion.direccion}
                    onChange={handleUbicacionChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_departamento">Departamento</Label>
                  <Select
                    value={nuevaUbicacion.id_departamento}
                    onValueChange={(value) => handleUbicacionSelectChange("id_departamento", value)}
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
                  <Label htmlFor="id_municipio">
                    Municipio
                    {loadingMunicipios && <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />}
                  </Label>
                  <Select
                    value={nuevaUbicacion.id_municipio}
                    onValueChange={(value) => handleUbicacionSelectChange("id_municipio", value)}
                    disabled={!nuevaUbicacion.id_departamento || loadingMunicipios || municipios.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingMunicipios
                            ? "Cargando municipios..."
                            : errorMunicipios
                              ? "Error al cargar municipios"
                              : municipios.length === 0 && nuevaUbicacion.id_departamento
                                ? "No hay municipios disponibles"
                                : "Seleccione un municipio"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map((municipio) => (
                        <SelectItem key={municipio.id} value={municipio.id.toString()}>
                          {municipio.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errorMunicipios && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{errorMunicipios}</AlertDescription>
                    </Alert>
                  )}

                  {/* Información de diagnóstico */}
                  {apiResponse && (
                    <div className="mt-2 p-2 text-xs bg-gray-100 rounded-md">
                      <details>
                        <summary className="cursor-pointer font-medium">Información de diagnóstico</summary>
                        <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                      </details>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="es_principal"
                    checked={nuevaUbicacion.es_principal}
                    onCheckedChange={handleUbicacionCheckboxChange}
                  />
                  <Label htmlFor="es_principal">Ubicación Principal</Label>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddUbicacion}
                    disabled={
                      !nuevaUbicacion.nombre_finca ||
                      !nuevaUbicacion.direccion ||
                      !nuevaUbicacion.id_departamento ||
                      !nuevaUbicacion.id_municipio
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Ubicación
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ubicaciones Registradas</CardTitle>
              <CardDescription>Ubicaciones asociadas a este contacto</CardDescription>
            </CardHeader>
            <CardContent>
              {ubicacionesState.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hay ubicaciones registradas para este contacto.
                </p>
              ) : (
                <div className="space-y-4">
                  {ubicacionesState.map((ubicacion) => (
                    <div key={ubicacion.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                          {ubicacion.nombre_finca}
                          {ubicacion.es_principal && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Principal
                            </span>
                          )}
                          {ubicacion.es_nueva && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Nueva
                            </span>
                          )}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setUbicacionToDelete(ubicacion)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ubicacion.direccion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ubicacion.municipio_nombre}, {ubicacion.departamento_nombre}
                      </p>
                      {ubicacion.area_hectareas && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Área:</span> {ubicacion.area_hectareas} hectáreas
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" asChild>
          <Link href="/contactos">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : contact ? (
            "Actualizar"
          ) : (
            "Guardar"
          )}
        </Button>
      </div>

      <AlertDialog open={!!ubicacionToDelete} onOpenChange={(open) => !open && setUbicacionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              {ubicacionToDelete?.es_nueva
                ? "Esta ubicación se eliminará de la lista."
                : "Esta ubicación será eliminada cuando guarde el contacto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteUbicacion(ubicacionToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
