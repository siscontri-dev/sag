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
import { PlusCircle, Trash, Loader2, AlertCircle, Home, Check, MapPin } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"
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
import { Badge } from "@/components/ui/badge"

export default function ContactForm({ departamentos = [], contact = null, ubicaciones = [] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    marca: contact?.marca || "",
    imagen_url: contact?.imagen_url || "",
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
  const [ubicacionToEdit, setUbicacionToEdit] = useState(null)
  const [ubicacionesEditadas, setUbicacionesEditadas] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [showPrincipalWarning, setShowPrincipalWarning] = useState(false)

  // Función para cargar municipios usando la API
  const fetchMunicipiosFromAPI = async (departamentoId) => {
    setLoadingMunicipios(true)
    setErrorMunicipios("")

    try {
      const response = await fetch(`/api/municipios/${departamentoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error HTTP: ${response.status}`)
      }

      setMunicipios(data.municipios || [])
      return data.municipios || []
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

  const handleImageChange = (imageUrl) => {
    setFormData((prev) => ({ ...prev, imagen_url: imageUrl }))
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
    // Si estamos marcando como principal, verificar si ya hay otra ubicación principal
    if (checked) {
      // Si estamos editando, verificar si la ubicación que estamos editando ya era principal
      if (isEditing && ubicacionToEdit && ubicacionToEdit.es_principal) {
        // Si ya era principal, simplemente actualizar el estado
        setNuevaUbicacion((prev) => ({ ...prev, es_principal: checked }))
        return
      }

      // Verificar si hay otra ubicación principal
      const existePrincipal = ubicacionesState.some(
        (u) => u.es_principal && (!ubicacionToEdit || u.id !== ubicacionToEdit.id),
      )

      if (existePrincipal) {
        // Mostrar advertencia
        setShowPrincipalWarning(true)
      }
    }

    // Actualizar el estado
    setNuevaUbicacion((prev) => ({ ...prev, es_principal: checked }))
  }

  const handleConfirmPrincipalChange = () => {
    // Actualizar todas las ubicaciones para quitar la marca de principal
    setUbicacionesState(
      ubicacionesState.map((u) => {
        if (u.es_principal && (!ubicacionToEdit || u.id !== ubicacionToEdit.id)) {
          // Marcar esta ubicación como editada si no es nueva
          if (!u.es_nueva) {
            setUbicacionesEditadas([
              ...ubicacionesEditadas.filter((ue) => ue.id !== u.id),
              {
                ...u,
                es_principal: false,
              },
            ])
          }

          return {
            ...u,
            es_principal: false,
            editado: true,
          }
        }
        return u
      }),
    )

    setShowPrincipalWarning(false)
  }

  const handleCancelPrincipalChange = () => {
    // Revertir el cambio en nuevaUbicacion
    setNuevaUbicacion((prev) => ({
      ...prev,
      es_principal: false,
    }))

    setShowPrincipalWarning(false)
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

    // Si esta ubicación será principal, actualizar las demás
    if (nuevaUbicacion.es_principal) {
      setUbicacionesState(
        ubicacionesState.map((u) => {
          if (u.es_principal) {
            // Marcar esta ubicación como editada si no es nueva
            if (!u.es_nueva) {
              setUbicacionesEditadas([
                ...ubicacionesEditadas.filter((ue) => ue.id !== u.id),
                {
                  ...u,
                  es_principal: false,
                },
              ])
            }

            return {
              ...u,
              es_principal: false,
              editado: true,
            }
          }
          return u
        }),
      )
    }

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
    // Verificar si es la única ubicación principal
    if (ubicacion.es_principal && ubicacionesState.filter((u) => u.es_principal).length === 1) {
      toast({
        title: "Error",
        description:
          "No se puede eliminar la única ubicación principal. Debe marcar otra ubicación como principal primero.",
        variant: "destructive",
      })
      setUbicacionToDelete(null)
      return
    }

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

  const handleEditUbicacion = (ubicacion) => {
    setUbicacionToEdit(ubicacion)
    setNuevaUbicacion({
      direccion: ubicacion.direccion,
      id_departamento: ubicacion.id_departamento?.toString() || "",
      id_municipio: ubicacion.id_municipio?.toString() || "",
      nombre_finca: ubicacion.nombre_finca,
      area_hectareas: ubicacion.area_hectareas?.toString() || "",
      es_principal: ubicacion.es_principal,
    })
    setIsEditing(true)

    // Cargar los municipios para el departamento seleccionado
    if (ubicacion.id_departamento) {
      fetchMunicipiosFromAPI(Number(ubicacion.id_departamento))
    }
  }

  const handleSaveEditedUbicacion = () => {
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

    // Si esta ubicación será principal y no lo era antes, actualizar las demás
    if (nuevaUbicacion.es_principal && !ubicacionToEdit.es_principal) {
      setUbicacionesState(
        ubicacionesState.map((u) => {
          if (u.id !== ubicacionToEdit.id && u.es_principal) {
            // Marcar esta ubicación como editada si no es nueva
            if (!u.es_nueva) {
              setUbicacionesEditadas([
                ...ubicacionesEditadas.filter((ue) => ue.id !== u.id),
                {
                  ...u,
                  es_principal: false,
                },
              ])
            }

            return {
              ...u,
              es_principal: false,
              editado: true,
            }
          }
          return u
        }),
      )
    }

    // Crear la ubicación actualizada
    const updatedUbicacion = {
      ...ubicacionToEdit,
      direccion: nuevaUbicacion.direccion,
      id_departamento: Number(nuevaUbicacion.id_departamento),
      id_municipio: Number(nuevaUbicacion.id_municipio),
      nombre_finca: nuevaUbicacion.nombre_finca,
      area_hectareas: nuevaUbicacion.area_hectareas ? Number(nuevaUbicacion.area_hectareas) : null,
      es_principal: nuevaUbicacion.es_principal,
      departamento_nombre: departamento?.nombre || "Departamento desconocido",
      municipio_nombre: municipio?.nombre || "Municipio desconocido",
      editado: true,
    }

    // Actualizar el estado de ubicaciones
    setUbicacionesState(ubicacionesState.map((u) => (u.id === ubicacionToEdit.id ? updatedUbicacion : u)))

    // Guardar la ubicación editada para enviarla al servidor
    if (!ubicacionToEdit.es_nueva) {
      setUbicacionesEditadas([
        ...ubicacionesEditadas.filter((u) => u.id !== ubicacionToEdit.id),
        {
          id: ubicacionToEdit.id,
          direccion: nuevaUbicacion.direccion,
          id_departamento: Number(nuevaUbicacion.id_departamento),
          id_municipio: Number(nuevaUbicacion.id_municipio),
          nombre_finca: nuevaUbicacion.nombre_finca,
          area_hectareas: nuevaUbicacion.area_hectareas ? Number(nuevaUbicacion.area_hectareas) : null,
          es_principal: nuevaUbicacion.es_principal,
        },
      ])
    } else {
      // Si es una ubicación nueva, actualizamos el array de ubicacionesNuevas
      setUbicacionesNuevas(
        ubicacionesNuevas.map((u) => {
          if (u.id === ubicacionToEdit.id) {
            return {
              ...u,
              direccion: nuevaUbicacion.direccion,
              id_departamento: Number(nuevaUbicacion.id_departamento),
              id_municipio: Number(nuevaUbicacion.id_municipio),
              nombre_finca: nuevaUbicacion.nombre_finca,
              area_hectareas: nuevaUbicacion.area_hectareas ? Number(nuevaUbicacion.area_hectareas) : null,
              es_principal: nuevaUbicacion.es_principal,
            }
          }
          return u
        }),
      )
    }

    // Limpiar el formulario y salir del modo edición
    setNuevaUbicacion({
      direccion: "",
      id_departamento: "",
      id_municipio: "",
      nombre_finca: "",
      area_hectareas: "",
      es_principal: false,
    })
    setUbicacionToEdit(null)
    setIsEditing(false)

    toast({
      title: "Ubicación actualizada",
      description: "La ubicación se ha actualizado correctamente",
    })
  }

  const handleCancelEdit = () => {
    setNuevaUbicacion({
      direccion: "",
      id_departamento: "",
      id_municipio: "",
      nombre_finca: "",
      area_hectareas: "",
      es_principal: false,
    })
    setUbicacionToEdit(null)
    setIsEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar campos específicos según el tipo de contacto
      if ((formData.type === "2" || formData.type === "3") && (!formData.marca || !formData.imagen_url)) {
        toast({
          title: "Error",
          description: "Para Dueño Nuevo o Ambos, la marca y el logo son obligatorios",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validar que exista al menos una ubicación
      if (ubicacionesState.length === 0) {
        toast({
          title: "Error",
          description: "Debe agregar al menos una ubicación para el contacto",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Validar que exista al menos una ubicación principal
      const tienePrincipal = ubicacionesState.some((u) => u.es_principal)
      if (!tienePrincipal) {
        toast({
          title: "Error",
          description: "Debe marcar al menos una ubicación como principal",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Crear un objeto FormData con los datos del formulario
      const formDataObj = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Añadir las ubicaciones nuevas y eliminadas
      formDataObj.append("ubicacionesNuevas", JSON.stringify(ubicacionesNuevas))
      formDataObj.append("ubicacionesEliminadas", JSON.stringify(ubicacionesEliminadas))
      formDataObj.append("ubicacionesEditadas", JSON.stringify(ubicacionesEditadas))

      console.log("Enviando datos del formulario:", {
        contacto: Object.fromEntries(formDataObj.entries()),
        ubicacionesNuevas: ubicacionesNuevas,
        ubicacionesEliminadas: ubicacionesEliminadas,
        ubicacionesEditadas: ubicacionesEditadas,
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

  const type = Number(formData.type)
  const marca = {
    label: "Marca",
    required: type === 2 || type === 3,
  }

  const imagen_url = {
    label: "Logo de la Marca",
    required: type === 2 || type === 3,
  }

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Datos básicos del contacto</CardDescription>
        </CardHeader>
        <CardContent>
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
            {type === 2 || type === 3 ? (
              <>
                <div className="col-span-2">
                  <Label htmlFor="marca" className={marca.required ? "required" : ""}>
                    {marca.label}
                  </Label>
                  <Input
                    id="marca"
                    name="marca"
                    value={formData.marca || ""}
                    onChange={handleInputChange}
                    className={errors.marca ? "border-red-500" : ""}
                    required={marca.required}
                  />
                  {errors.marca && <p className="text-red-500 text-sm mt-1">{errors.marca}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="imagen_url" className={imagen_url.required ? "required" : ""}>
                    {imagen_url.label}
                  </Label>
                  <ImageUpload
                    value={formData.imagen_url || ""}
                    onChange={(url) => setFormData({ ...formData, imagen_url: url })}
                  />
                  {errors.imagen_url && <p className="text-red-500 text-sm mt-1">{errors.imagen_url}</p>}
                </div>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Ubicaciones - Ahora en la misma página */}
      <Card>
        <CardHeader>
          <CardTitle>Ubicaciones</CardTitle>
          <CardDescription className="flex items-center text-amber-600">
            <AlertCircle className="h-4 w-4 mr-2" />
            Todo contacto debe tener al menos una ubicación marcada como principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Ubicaciones Registradas */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Ubicaciones Registradas</h3>
            {ubicacionesState.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atención</AlertTitle>
                <AlertDescription>
                  No hay ubicaciones registradas. Debe agregar al menos una ubicación para el contacto.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ubicacionesState.map((ubicacion) => (
                  <div
                    key={ubicacion.id}
                    className={`border rounded-md p-4 ${ubicacion.es_principal ? "border-blue-500 bg-blue-50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {ubicacion.es_principal ? (
                          <Home className="h-4 w-4 text-blue-600" />
                        ) : (
                          <MapPin className="h-4 w-4 text-gray-400" />
                        )}
                        <h3 className="font-medium">{ubicacion.nombre_finca}</h3>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUbicacion(ubicacion)}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                            <path d="m15 5 4 4"></path>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setUbicacionToDelete(ubicacion)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ubicacion.es_principal && (
                        <Badge variant="default" className="bg-blue-500">
                          <Check className="h-3 w-3 mr-1" /> Principal
                        </Badge>
                      )}
                      {ubicacion.es_nueva && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Nueva
                        </Badge>
                      )}
                      {ubicacion.editado && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          Editada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{ubicacion.direccion}</p>
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
          </div>

          {/* Añadir Nueva Ubicación */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-3">{isEditing ? "Editar Ubicación" : "Añadir Nueva Ubicación"}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_finca">Nombre de la Ubicación *</Label>
                <Input
                  id="nombre_finca"
                  name="nombre_finca"
                  value={nuevaUbicacion.nombre_finca}
                  onChange={handleUbicacionChange}
                  required
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
                <Label htmlFor="direccion">Dirección *</Label>
                <Textarea
                  id="direccion"
                  name="direccion"
                  value={nuevaUbicacion.direccion}
                  onChange={handleUbicacionChange}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_departamento">Departamento *</Label>
                <Select
                  value={nuevaUbicacion.id_departamento}
                  onValueChange={(value) => handleUbicacionSelectChange("id_departamento", value)}
                  required
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
                  Municipio *{loadingMunicipios && <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />}
                </Label>
                <Select
                  value={nuevaUbicacion.id_municipio}
                  onValueChange={(value) => handleUbicacionSelectChange("id_municipio", value)}
                  disabled={!nuevaUbicacion.id_departamento || loadingMunicipios || municipios.length === 0}
                  required
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
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="es_principal"
                  checked={nuevaUbicacion.es_principal}
                  onCheckedChange={handleUbicacionCheckboxChange}
                />
                <Label htmlFor="es_principal" className="flex items-center">
                  <span>Ubicación Principal</span>
                  {nuevaUbicacion.es_principal && (
                    <Badge className="ml-2 bg-blue-500">
                      <Check className="h-3 w-3 mr-1" /> Principal
                    </Badge>
                  )}
                </Label>
              </div>
              <div className="flex justify-end sm:col-span-2 space-x-2">
                {isEditing ? (
                  <>
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveEditedUbicacion}
                      disabled={
                        !nuevaUbicacion.nombre_finca ||
                        !nuevaUbicacion.direccion ||
                        !nuevaUbicacion.id_departamento ||
                        !nuevaUbicacion.id_municipio
                      }
                    >
                      Guardar Cambios
                    </Button>
                  </>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Diálogo de confirmación para eliminar ubicación */}
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

      {/* Diálogo de confirmación para cambiar ubicación principal */}
      <AlertDialog open={showPrincipalWarning} onOpenChange={setShowPrincipalWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar ubicación principal</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existe una ubicación marcada como principal. Si continúa, la ubicación principal actual dejará de
              serlo. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPrincipalChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPrincipalChange}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
