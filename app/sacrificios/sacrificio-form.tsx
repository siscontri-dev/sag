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
import { formatCurrency } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { createSacrificio } from "./actions"
import PrintSacrificioDialog from "@/components/print-sacrificio-dialog"
import { AlertCircle, Loader2, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Importar los componentes necesarios para los diálogos
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createUbication, createContact } from "@/app/contactos/actions"
import { PlusCircle } from "lucide-react"
import ImageUpload from "@/components/image-upload"

export default function SacrificioForm({
  contactosAnteriores = [],
  contactosNuevos = [],
  tipoAnimal = "bovino",
  locationId = 1,
  impuestos = [],
  sacrificio = null,
  ultimoConsecutivo = 0,
  ultimaPlanilla = 0,
  consignantes = [],
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para el diálogo de impresión
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  // Añadir estados para los diálogos de creación de contactos y ubicaciones
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)
  const [contactType, setContactType] = useState("anterior") // "anterior" o "nuevo"
  const [showCreateUbicacionNuevoDialog, setShowCreateUbicacionNuevoDialog] = useState(false)
  const [newContactData, setNewContactData] = useState({
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    nit: "",
    telefono: "",
    email: "",
    type: "1", // Por defecto, dueño anterior
    marca: "",
    imagen_url: "",
    // Campos para ubicación
    nombre_finca: "",
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    area_hectareas: "",
    es_principal: true, // Por defecto, la primera ubicación es principal
  })
  const [isCreatingContact, setIsCreatingContact] = useState(false)
  const [departamentos, setDepartamentos] = useState([])
  const [municipiosUbicacionNuevo, setMunicipiosUbicacionNuevo] = useState([])
  const [municipiosContacto, setMunicipiosContacto] = useState([])
  const [showCreateFincaDialog, setShowCreateFincaDialog] = useState(false)

  // Estados para el buscador de contactos
  const [searchDuenoAnterior, setSearchDuenoAnterior] = useState("")
  const [searchDuenoNuevo, setSearchDuenoNuevo] = useState("")
  const [showDropdownAnterior, setShowDropdownAnterior] = useState(false)
  const [showDropdownNuevo, setShowDropdownNuevo] = useState(false)
  const [filteredContactosAnteriores, setFilteredContactosAnteriores] = useState([])
  const [filteredContactosNuevos, setFilteredContactosNuevos] = useState([])
  const duenoAnteriorRef = useRef(null)
  const duenoNuevoRef = useRef(null)

  // Agregar nuevos estados para el índice seleccionado
  const [selectedIndexAnterior, setSelectedIndexAnterior] = useState(-1)
  const [selectedIndexNuevo, setSelectedIndexNuevo] = useState(-1)

  // Colores según el tipo de animal
  const colors = tipoAnimal === "bovino" ? themeColors.bovino : themeColors.porcino

  // Generar automáticamente el número de documento y planilla
  const nuevoConsecutivo = Number(ultimoConsecutivo) + 1
  const nuevaPlanilla = Number(ultimaPlanilla) + 1

  console.log(`Nuevo consecutivo para ${tipoAnimal}: ${nuevoConsecutivo} (último: ${ultimoConsecutivo})`)
  console.log(`Nueva planilla para ${tipoAnimal}: ${nuevaPlanilla} (última: ${ultimaPlanilla})`)

  // Obtener la fecha actual en la zona horaria local (Bogotá/Lima)
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const formattedDate = `${year}-${month}-${day}`

  // Inicializar el formulario con la fecha actual
  const [formData, setFormData] = useState({
    numero_documento: sacrificio?.numero_documento || nuevoConsecutivo.toString(),
    fecha_documento: formattedDate,
    id_dueno_anterior: sacrificio?.id_dueno_anterior?.toString() || "",
    id_dueno_nuevo: sacrificio?.id_dueno_nuevo?.toString() || "",
    business_location_id: locationId.toString(),
    estado: sacrificio?.estado || "confirmado", // Cambiado a confirmado por defecto
    cantidad_machos: sacrificio?.cantidad_machos?.toString() || "0",
    cantidad_hembras: sacrificio?.cantidad_hembras?.toString() || "0",
    total_kilos: sacrificio?.total_kilos?.toString() || "0",
    colors: sacrificio?.colors || "", // Cambiado a colors en lugar de colores
    consignante: sacrificio?.consignante || "", // Ahora será el ID del consignante
    planilla: sacrificio?.planilla?.toString() || nuevaPlanilla.toString(), // Nuevo campo con valor automático
    observaciones: sacrificio?.observaciones || "",
  })

  // Estado para las ubicaciones
  const [selectedFinca, setSelectedFinca] = useState(sacrificio?.ubication_contact_id?.toString() || "")
  const [selectedUbicacionNuevo, setSelectedUbicacionNuevo] = useState(
    sacrificio?.ubication_contact_id2?.toString() || "",
  )
  const [fincas, setFincas] = useState([])
  const [ubicacionesNuevo, setUbicacionesNuevo] = useState([])
  const [isLoadingFincas, setIsLoadingFincas] = useState(false)
  const [isLoadingUbicacionesNuevo, setIsLoadingUbicacionesNuevo] = useState(false)
  const [showNoUbicacionAlert, setShowNoUbicacionAlert] = useState(false)
  const [isCreatingUbicacionNuevo, setIsCreatingUbicacionNuevo] = useState(false)

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

  // Añadir efectos para cargar departamentos y municipios
  // Efecto para cargar departamentos cuando se abre el modal de contacto
  useEffect(() => {
    if (showCreateContactDialog) {
      const fetchDepartamentos = async () => {
        try {
          const response = await fetch("/api/departamentos")
          if (response.ok) {
            const data = await response.json()
            setDepartamentos(data)
          }
        } catch (error) {
          console.error("Error al cargar departamentos:", error)
        }
      }
      fetchDepartamentos()
    }
  }, [showCreateContactDialog])

  // Efecto para cargar departamentos cuando se abre el modal de ubicación nuevo
  useEffect(() => {
    if (showCreateUbicacionNuevoDialog) {
      const fetchDepartamentos = async () => {
        try {
          const response = await fetch("/api/departamentos")
          if (response.ok) {
            const data = await response.json()
            setDepartamentos(data)
          }
        } catch (error) {
          console.error("Error al cargar departamentos:", error)
        }
      }
      fetchDepartamentos()
    }
  }, [showCreateUbicacionNuevoDialog])

  // Efecto para cargar municipios cuando cambia el departamento en contacto
  useEffect(() => {
    if (newContactData.id_departamento) {
      const loadMunicipios = async () => {
        const municipiosData = await fetchMunicipios(newContactData.id_departamento)
        setMunicipiosContacto(municipiosData)
      }
      loadMunicipios()
    } else {
      setMunicipiosContacto([])
    }
  }, [newContactData.id_departamento])

  // Modificar el estado de newUbicacionNuevoData para incluir marca e imagen_url
  const [newUbicacionNuevoData, setNewUbicacionNuevoData] = useState({
    nombre_finca: "",
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    area_hectareas: "",
    es_principal: false,
  })

  // Efecto para cargar municipios cuando cambia el departamento en ubicación nuevo
  useEffect(() => {
    if (newUbicacionNuevoData.id_departamento) {
      const loadMunicipios = async () => {
        const municipiosData = await fetchMunicipios(newUbicacionNuevoData.id_departamento)
        setMunicipiosUbicacionNuevo(municipiosData)
      }
      loadMunicipios()
    } else {
      setMunicipiosUbicacionNuevo([])
    }
  }, [newUbicacionNuevoData.id_departamento])

  // Función para cargar municipios
  const fetchMunicipios = async (departamentoId) => {
    try {
      const response = await fetch(`/api/municipios/${departamentoId}`)
      if (response.ok) {
        const data = await response.json()
        return data.municipios || []
      } else {
        console.error("Error al cargar municipios:", response.status)
        return []
      }
    } catch (error) {
      console.error("Error al cargar municipios:", error)
      return []
    }
  }

  // Efecto para cargar las fincas cuando cambia el dueño anterior
  useEffect(() => {
    if (formData.id_dueno_anterior) {
      const fetchFincas = async () => {
        setIsLoadingFincas(true)
        try {
          const response = await fetch(`/api/contactos/${formData.id_dueno_anterior}/ubicaciones`)
          if (response.ok) {
            const data = await response.json()
            setFincas(data)
            // Si hay fincas, seleccionar la predeterminada o la primera
            if (data.length > 0) {
              const predeterminada = data.find((f) => f.es_principal)
              if (predeterminada) {
                setSelectedFinca(predeterminada.id.toString())
              } else {
                setSelectedFinca(data[0].id.toString())
              }
            } else {
              setSelectedFinca("")
            }
          }
        } catch (error) {
          console.error("Error al cargar fincas:", error)
          setFincas([])
          setSelectedFinca("")
        } finally {
          setIsLoadingFincas(false)
        }
      }
      fetchFincas()
    } else {
      setFincas([])
      setSelectedFinca("")
    }
  }, [formData.id_dueno_anterior])

  // Efecto para cargar las ubicaciones cuando cambia el dueño nuevo
  useEffect(() => {
    if (formData.id_dueno_nuevo) {
      const fetchUbicaciones = async () => {
        setIsLoadingUbicacionesNuevo(true)
        setShowNoUbicacionAlert(false)
        try {
          const response = await fetch(`/api/contactos/${formData.id_dueno_nuevo}/ubicaciones`)
          if (response.ok) {
            const data = await response.json()
            setUbicacionesNuevo(data)
            // Si hay ubicaciones, seleccionar la predeterminada o la primera
            if (data.length > 0) {
              const predeterminada = data.find((u) => u.es_principal)
              if (predeterminada) {
                setSelectedUbicacionNuevo(predeterminada.id.toString())
              } else {
                setSelectedUbicacionNuevo(data[0].id.toString())
              }
            } else {
              setSelectedUbicacionNuevo("")
              setShowNoUbicacionAlert(true)
            }
          }
        } catch (error) {
          console.error("Error al cargar ubicaciones del dueño nuevo:", error)
          setUbicacionesNuevo([])
          setSelectedUbicacionNuevo("")
          setShowNoUbicacionAlert(true)
        } finally {
          setIsLoadingUbicacionesNuevo(false)
        }
      }
      fetchUbicaciones()
    } else {
      setUbicacionesNuevo([])
      setSelectedUbicacionNuevo("")
      setShowNoUbicacionAlert(false)
    }
  }, [formData.id_dueno_nuevo])

  // Añadir funciones para manejar cambios en los formularios
  const handleNewContactChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewContactData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleNewContactImageChange = (imageUrl) => {
    setNewContactData((prev) => ({
      ...prev,
      imagen_url: imageUrl,
    }))
  }

  const handleNewContactSelectChange = (name, value) => {
    setNewContactData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNewUbicacionNuevoChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewUbicacionNuevoData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Añadir función para manejar la creación de un nuevo contacto
  const handleCreateContact = async () => {
    if (!newContactData.primer_nombre || !newContactData.nit) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsCreatingContact(true)
    try {
      // Crear un FormData para enviar los datos
      const contactFormData = new FormData()
      contactFormData.append("primer_nombre", newContactData.primer_nombre)
      contactFormData.append("segundo_nombre", newContactData.segundo_nombre || "")
      contactFormData.append("primer_apellido", newContactData.primer_apellido || "")
      contactFormData.append("segundo_apellido", newContactData.segundo_apellido || "")
      contactFormData.append("nit", newContactData.nit)
      contactFormData.append("telefono", newContactData.telefono || "")
      contactFormData.append("email", newContactData.email || "")
      contactFormData.append("type", contactType === "anterior" ? "1" : "2")

      // Si es dueño nuevo, agregar marca e imagen
      if (contactType === "nuevo") {
        contactFormData.append("marca", newContactData.marca || "")
        contactFormData.append("imagen_url", newContactData.imagen_url || "")
      }

      // Añadir información de ubicación
      const ubicacionesNuevas = [
        {
          nombre_finca: newContactData.nombre_finca,
          direccion: newContactData.direccion || "",
          id_departamento: Number(newContactData.id_departamento),
          id_municipio: Number(newContactData.id_municipio),
          area_hectareas: newContactData.area_hectareas ? Number(newContactData.area_hectareas) : null,
          es_principal: newContactData.es_principal,
        },
      ]

      contactFormData.append("ubicacionesNuevas", JSON.stringify(ubicacionesNuevas))

      // Llamar a la función del servidor para crear el contacto
      const result = await createContact(contactFormData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Contacto creado correctamente",
        })

        // Crear un nuevo contacto para agregar a la lista
        const nuevoContacto = {
          id: result.contactId,
          primer_nombre: newContactData.primer_nombre,
          segundo_nombre: newContactData.segundo_nombre || "",
          primer_apellido: newContactData.primer_apellido || "",
          segundo_apellido: newContactData.segundo_apellido || "",
          nit: newContactData.nit,
          telefono: newContactData.telefono || "",
          email: newContactData.email || "",
          type: contactType === "anterior" ? 1 : 2,
          marca: contactType === "nuevo" ? newContactData.marca || "" : "",
          imagen_url: contactType === "nuevo" ? newContactData.imagen_url || "" : "",
        }

        // Actualizar las listas de contactos según el tipo
        if (contactType === "anterior") {
          // Actualizar la lista de contactos anteriores
          contactosAnteriores.push(nuevoContacto)
          setFormData((prev) => ({ ...prev, id_dueno_anterior: result.contactId.toString() }))
          setSearchDuenoAnterior(
            `${nuevoContacto.primer_nombre} ${nuevoContacto.primer_apellido} - ${nuevoContacto.nit}`,
          )

          // También agregar a la lista de contactos nuevos si es necesario
          if (nuevoContacto.type === 3) {
            contactosNuevos.push(nuevoContacto)
          }

          // Cargar las fincas del nuevo contacto
          const response = await fetch(`/api/contactos/${result.contactId}/ubicaciones`)
          if (response.ok) {
            const data = await response.json()
            setFincas(data)
            if (data.length > 0) {
              setSelectedFinca(data[0].id.toString())
            }
          }
        } else {
          // Actualizar la lista de contactos nuevos
          contactosNuevos.push(nuevoContacto)
          setFormData((prev) => ({ ...prev, id_dueno_nuevo: result.contactId.toString() }))
          setSearchDuenoNuevo(
            `${nuevoContacto.primer_nombre} ${nuevoContacto.primer_apellido} - ${nuevoContacto.nit}${nuevoContacto.marca ? ` (${nuevoContacto.marca})` : ""}`,
          )

          // También agregar a la lista de contactos anteriores si es necesario
          if (nuevoContacto.type === 3) {
            contactosAnteriores.push(nuevoContacto)
          }

          // Cargar las ubicaciones del nuevo contacto
          const response = await fetch(`/api/contactos/${result.contactId}/ubicaciones`)
          if (response.ok) {
            const data = await response.json()
            setUbicacionesNuevo(data)
            if (data.length > 0) {
              setSelectedUbicacionNuevo(data[0].id.toString())
            }
          }
        }

        // Cerrar el diálogo
        setShowCreateContactDialog(false)
        // Limpiar el formulario
        setNewContactData({
          primer_nombre: "",
          segundo_nombre: "",
          primer_apellido: "",
          segundo_apellido: "",
          nit: "",
          telefono: "",
          email: "",
          type: "1",
          marca: "",
          imagen_url: "",
          nombre_finca: "",
          direccion: "",
          id_departamento: "",
          id_municipio: "",
          area_hectareas: "",
          es_principal: true,
        })
      } else {
        throw new Error(result.message || "Error al crear el contacto")
      }
    } catch (error) {
      console.error("Error al crear contacto:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear el contacto",
        variant: "destructive",
      })
    } finally {
      setIsCreatingContact(false)
    }
  }

  // Añadir función para manejar cambios en la imagen de la ubicación
  // const handleNewUbicacionImageChange = (imageUrl) => {
  //   setNewUbicacionNuevoData((prev) => ({
  //   ...prev,
  //   imagen_url: imageUrl,
  //   }))
  // }

  // Añadir función para manejar la creación de una nueva ubicación para el dueño nuevo
  const handleCreateUbicacionNuevo = async () => {
    if (
      !newUbicacionNuevoData.nombre_finca ||
      !newUbicacionNuevoData.id_departamento ||
      !newUbicacionNuevoData.id_municipio
    ) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (!formData.id_dueno_nuevo) {
      toast({
        title: "Error",
        description: "Debe seleccionar un dueño nuevo primero",
        variant: "destructive",
      })
      return
    }

    setIsCreatingUbicacionNuevo(true)
    try {
      // Crear un FormData para enviar los datos
      const ubicacionFormData = new FormData()
      ubicacionFormData.append("nombre_finca", newUbicacionNuevoData.nombre_finca)
      ubicacionFormData.append("direccion", newUbicacionNuevoData.direccion || "")
      ubicacionFormData.append("id_departamento", newUbicacionNuevoData.id_departamento)
      ubicacionFormData.append("id_municipio", newUbicacionNuevoData.id_municipio)
      ubicacionFormData.append("area_hectareas", newUbicacionNuevoData.area_hectareas || "")
      ubicacionFormData.append("es_principal", newUbicacionNuevoData.es_principal ? "true" : "false")
      // ubicacionFormData.append("marca", newUbicacionNuevoData.marca || "") // Añadir marca
      // ubicacionFormData.append("imagen_url", newUbicacionNuevoData.imagen_url || "") // Añadir imagen_url

      // Llamar a la función del servidor para crear la ubicación
      const contactId = Number(formData.id_dueno_nuevo)
      const result = await createUbication(contactId, ubicacionFormData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Ubicación creada correctamente",
        })

        // Recargar las ubicaciones del dueño nuevo
        const response = await fetch(`/api/contactos/${formData.id_dueno_nuevo}/ubicaciones`)
        if (response.ok) {
          const data = await response.json()
          setUbicacionesNuevo(data)
          // Seleccionar la ubicación recién creada
          if (result.id) {
            setSelectedUbicacionNuevo(result.id.toString())
          }
        }

        // Cerrar el diálogo
        setShowCreateUbicacionNuevoDialog(false)
        // Limpiar el formulario
        setNewUbicacionNuevoData({
          nombre_finca: "",
          direccion: "",
          id_departamento: "",
          id_municipio: "",
          area_hectareas: "",
          es_principal: false,
        })
      } else {
        throw new Error(result.message || "Error al crear la ubicación")
      }
    } catch (error) {
      console.error("Error al crear ubicación:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear la ubicación",
        variant: "destructive",
      })
    } finally {
      setIsCreatingUbicacionNuevo(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Para campos numéricos, solo permitir números
    if (
      name === "cantidad_machos" ||
      name === "cantidad_hembras" ||
      name === "total_kilos" ||
      name === "planilla" ||
      name === "numero_documento"
    ) {
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
        consignante: formData.consignante, // Ahora es el ID del consignante
        planilla: Number(formData.planilla), // Nuevo campo
        consec: Number(formData.numero_documento), // Usar el número de documento como consec
        observaciones: formData.observaciones, // Campo para recibos de báscula
        ubication_contact_id: selectedFinca ? Number(selectedFinca) : null, // Ubicación del dueño anterior
        ubication_contact_id2: selectedUbicacionNuevo ? Number(selectedUbicacionNuevo) : null, // Ubicación del dueño nuevo
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

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (duenoAnteriorRef.current && !duenoAnteriorRef.current.contains(event.target)) {
        setShowDropdownAnterior(false)
      }
      if (duenoNuevoRef.current && !duenoNuevoRef.current.contains(event.target)) {
        setShowDropdownNuevo(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Inicializar los contactos filtrados
  useEffect(() => {
    setFilteredContactosAnteriores(contactosAnteriores.filter((contact) => contact.type === 1))
  }, [contactosAnteriores])

  useEffect(() => {
    setFilteredContactosNuevos(contactosNuevos.filter((contact) => contact.type === 2 || contact.type === 3))
  }, [contactosNuevos])

  // 1. Primero, modificar los efectos para filtrar contactos por business_location_id
  // Reemplazar estas líneas:
  // useEffect(() => {
  //   setFilteredContactosAnteriores(contactosAnteriores.filter((contact) => contact.type === 1))
  // }, [contactosAnteriores])

  // useEffect(() => {
  //   setFilteredContactosNuevos(contactosNuevos.filter((contact) => contact.type === 2 || contact.type === 3))
  // }, [contactosNuevos])

  // Por estas líneas que incluyen el filtro por business_location_id:
  // useEffect(() => {
  //   setFilteredContactosAnteriores(
  //     contactosAnteriores.filter(
  //       (contact) => contact.type === 1 && contact.business_location_id === Number(formData.business_location_id),
  //     ),
  //   )
  // }, [contactosAnteriores, formData.business_location_id])

  // useEffect(() => {
  //   setFilteredContactosNuevos(
  //     contactosNuevos.filter(
  //       (contact) =>
  //         (contact.type === 2 || contact.type === 3) &&
  //         contact.business_location_id === Number(formData.business_location_id),
  //     ),
  //   )
  // }, [contactosNuevos, formData.business_location_id])

  // Modificar los efectos para filtrar contactos correctamente según business_location_id
  // Reemplazar los efectos actuales (aproximadamente líneas 371-383) con estos:

  // Para filtrar contactos anteriores (propietarios)
  useEffect(() => {
    // Filtrar contactos según business_location_id
    // Si estamos en bovinos (tipoAnimal === "bovino"), mostrar contactos con business_location_id = 2
    // Si estamos en porcinos (tipoAnimal === "porcino"), mostrar contactos con business_location_id = 1
    const locationIdToFilter = tipoAnimal === "bovino" ? 2 : 1

    setFilteredContactosAnteriores(
      contactosAnteriores.filter((contact) => contact.business_location_id === locationIdToFilter),
    )
  }, [contactosAnteriores, tipoAnimal])

  // Para filtrar contactos nuevos
  useEffect(() => {
    // Filtrar contactos según business_location_id
    // Si estamos en bovinos (tipoAnimal === "bovino"), mostrar contactos con business_location_id = 2
    // Si estamos en porcinos (tipoAnimal === "porcino"), mostrar contactos con business_location_id = 1
    const locationIdToFilter = tipoAnimal === "bovino" ? 2 : 1

    setFilteredContactosNuevos(contactosNuevos.filter((contact) => contact.business_location_id === locationIdToFilter))
  }, [contactosNuevos, tipoAnimal])

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
            Guía de Degüello
          </Label>
          <Input
            id="numero_documento"
            name="numero_documento"
            value={formData.numero_documento}
            onChange={handleChange}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fecha_documento" className="text-sm">
            Fecha
          </Label>
          <Input
            type="date"
            id="fecha_documento"
            name="fecha_documento"
            value={formData.fecha_documento}
            onChange={handleChange}
            className="w-full"
            required
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
          <div className="flex justify-between items-center">
            <Label htmlFor="id_dueno_anterior" className="text-sm">
              Propietario
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setContactType("anterior")
                setShowCreateContactDialog(true)
              }}
              className="h-6 px-2 text-xs"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Nuevo
            </Button>
          </div>
          <div className="relative">
            <Input
              id="search_dueno_anterior"
              placeholder="Buscar por nombre, apellido o NIT..."
              value={searchDuenoAnterior}
              autoComplete="off"
              onChange={(e) => {
                setSearchDuenoAnterior(e.target.value)
                setShowDropdownAnterior(true)
                setSelectedIndexAnterior(-1) // Resetear el índice seleccionado

                // Filtrar contactos mientras se escribe
                const searchTerm = e.target.value.toLowerCase()
                const filtered = contactosAnteriores
                  .filter((contact) => contact.type === 1)
                  .filter(
                    (contact) =>
                      (contact.primer_nombre && contact.primer_nombre.toLowerCase().includes(searchTerm)) ||
                      (contact.primer_apellido && contact.primer_apellido.toLowerCase().includes(searchTerm)) ||
                      (contact.nit && contact.nit.toLowerCase().includes(searchTerm)),
                  )
                setFilteredContactosAnteriores(filtered)
              }}
              onFocus={() => setShowDropdownAnterior(true)}
              onKeyDown={(e) => {
                if (!showDropdownAnterior || filteredContactosAnteriores.length === 0) return

                // Navegar con flechas
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setSelectedIndexAnterior((prevIndex) =>
                    prevIndex < filteredContactosAnteriores.length - 1 ? prevIndex + 1 : prevIndex,
                  )
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setSelectedIndexAnterior((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
                } else if (e.key === "Enter" && selectedIndexAnterior >= 0) {
                  e.preventDefault()
                  const contacto = filteredContactosAnteriores[selectedIndexAnterior]
                  setFormData((prev) => ({ ...prev, id_dueno_anterior: contacto.id.toString() }))
                  setSearchDuenoAnterior(`${contacto.primer_nombre} ${contacto.primer_apellido} - ${contacto.nit}`)
                  setShowDropdownAnterior(false)
                } else if (e.key === "Escape") {
                  setShowDropdownAnterior(false)
                }
              }}
              className="h-8"
            />
            {formData.id_dueno_anterior && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, id_dueno_anterior: "" }))
                  setSearchDuenoAnterior("")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {showDropdownAnterior && searchDuenoAnterior && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {filteredContactosAnteriores.length > 0 ? (
                  filteredContactosAnteriores.map((contacto, index) => (
                    <div
                      key={contacto.id}
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                        index === selectedIndexAnterior ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, id_dueno_anterior: contacto.id.toString() }))
                        setSearchDuenoAnterior(
                          `${contacto.primer_nombre} ${contacto.primer_apellido} - ${contacto.nit}`,
                        )
                        setShowDropdownAnterior(false)
                      }}
                    >
                      {contacto.primer_nombre} {contacto.primer_apellido} - {contacto.nit}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selector de finca para dueño anterior */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label htmlFor="finca" className="text-sm">
              Finca
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateFincaDialog(true)}
              disabled={!formData.id_dueno_anterior}
              className="h-6 px-2 text-xs"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Nueva
            </Button>
          </div>
          <Select
            value={selectedFinca}
            onValueChange={setSelectedFinca}
            disabled={isLoadingFincas || fincas.length === 0}
          >
            <SelectTrigger className="h-8">
              {isLoadingFincas ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  <span>Cargando fincas...</span>
                </div>
              ) : (
                <SelectValue placeholder={fincas.length === 0 ? "No hay fincas disponibles" : "Seleccione una finca"} />
              )}
            </SelectTrigger>
            <SelectContent>
              {fincas.map((finca) => (
                <SelectItem key={finca.id} value={finca.id.toString()}>
                  {finca.nombre_finca} - {finca.municipio_nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label htmlFor="id_dueno_nuevo" className="text-sm">
              Nuevo Propietario
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setContactType("nuevo")
                setShowCreateContactDialog(true)
              }}
              className="h-6 px-2 text-xs"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Nuevo
            </Button>
          </div>
          <div className="relative">
            <Input
              id="search_dueno_nuevo"
              placeholder="Buscar por nombre, apellido, NIT o marca..."
              value={searchDuenoNuevo}
              autoComplete="off"
              onChange={(e) => {
                setSearchDuenoNuevo(e.target.value)
                setShowDropdownNuevo(true)
                setSelectedIndexNuevo(-1) // Resetear el índice seleccionado

                // Filtrar contactos mientras se escribe
                const searchTerm = e.target.value.toLowerCase()
                const filtered = contactosNuevos
                  .filter((contact) => contact.type === 2 || contact.type === 3)
                  .filter(
                    (contact) =>
                      (contact.primer_nombre && contact.primer_nombre.toLowerCase().includes(searchTerm)) ||
                      (contact.primer_apellido && contact.primer_apellido.toLowerCase().includes(searchTerm)) ||
                      (contact.nit && contact.nit.toLowerCase().includes(searchTerm)) ||
                      (contact.marca && contact.marca.toLowerCase().includes(searchTerm)),
                  )
                setFilteredContactosNuevos(filtered)
              }}
              onFocus={() => setShowDropdownNuevo(true)}
              onKeyDown={(e) => {
                if (!showDropdownNuevo || filteredContactosNuevos.length === 0) return

                // Navegar con flechas
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setSelectedIndexNuevo((prevIndex) =>
                    prevIndex < filteredContactosNuevos.length - 1 ? prevIndex + 1 : prevIndex,
                  )
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setSelectedIndexNuevo((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
                } else if (e.key === "Enter" && selectedIndexNuevo >= 0) {
                  e.preventDefault()
                  const contacto = filteredContactosNuevos[selectedIndexNuevo]
                  setFormData((prev) => ({ ...prev, id_dueno_nuevo: contacto.id.toString() }))
                  setSearchDuenoNuevo(
                    `${contacto.primer_nombre} ${contacto.primer_apellido} - ${contacto.nit}${contacto.marca ? ` (${contacto.marca})` : ""}`,
                  )
                  setShowDropdownNuevo(false)
                } else if (e.key === "Escape") {
                  setShowDropdownNuevo(false)
                }
              }}
              className="h-8"
            />
            {formData.id_dueno_nuevo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, id_dueno_nuevo: "" }))
                  setSearchDuenoNuevo("")
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {showDropdownNuevo && searchDuenoNuevo && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                {filteredContactosNuevos.length > 0 ? (
                  filteredContactosNuevos.map((contacto, index) => (
                    <div
                      key={contacto.id}
                      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                        index === selectedIndexNuevo ? "bg-gray-100" : ""
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, id_dueno_nuevo: contacto.id.toString() }))
                        setSearchDuenoNuevo(
                          `${contacto.primer_nombre} ${contacto.primer_apellido} - ${contacto.nit}${contacto.marca ? ` (${contacto.marca})` : ""}`,
                        )
                        setShowDropdownNuevo(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {contacto.imagen_url && (
                          <img
                            src={contacto.imagen_url || "/placeholder.svg"}
                            alt={contacto.marca || "Logo"}
                            className="h-5 w-5 object-contain"
                            onError={(e) => (e.currentTarget.src = "/abstract-logo.png")}
                          />
                        )}
                        {contacto.primer_nombre} {contacto.primer_apellido} - {contacto.nit}
                        {contacto.marca && ` (${contacto.marca})`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>
          {formData.id_dueno_nuevo && (
            <div className="mt-2">
              {contactosNuevos
                .filter((contact) => contact.type === 2 || contact.type === 3)
                .find((c) => c.id.toString() === formData.id_dueno_nuevo)?.imagen_url && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <img
                    src={
                      contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.imagen_url ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg" ||
                      "/placeholder.svg"
                    }
                    alt="Logo de la marca"
                    className="h-8 object-contain"
                    onError={(e) => (e.currentTarget.src = "/abstract-logo.png")}
                  />
                  <span className="font-medium">
                    {contactosNuevos.find((c) => c.id.toString() === formData.id_dueno_nuevo)?.marca || ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selector de ubicación para dueño nuevo */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label htmlFor="ubicacion_nuevo" className="text-sm">
              Dirección Propietario
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateUbicacionNuevoDialog(true)}
              disabled={!formData.id_dueno_nuevo}
              className="h-6 px-2 text-xs"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Nueva
            </Button>
          </div>
          <Select
            value={selectedUbicacionNuevo}
            onValueChange={setSelectedUbicacionNuevo}
            disabled={isLoadingUbicacionesNuevo || ubicacionesNuevo.length === 0}
          >
            <SelectTrigger className="h-8">
              {isLoadingUbicacionesNuevo ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  <span>Cargando ubicaciones...</span>
                </div>
              ) : (
                <SelectValue
                  placeholder={
                    ubicacionesNuevo.length === 0 ? "No hay ubicaciones disponibles" : "Seleccione una ubicación"
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent>
              {ubicacionesNuevo.map((ubicacion) => (
                <SelectItem key={ubicacion.id} value={ubicacion.id.toString()}>
                  {ubicacion.nombre_finca} - {ubicacion.municipio_nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showNoUbicacionAlert && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                El dueño nuevo no tiene ubicaciones registradas. Se recomienda agregar una ubicación.
              </AlertDescription>
            </Alert>
          )}
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
        <div className="space-y-1">
          <Label htmlFor="consignante" className="text-sm">
            Consignante
          </Label>
          {/* Reemplazar el Input por un Select para los consignantes */}
          <Select value={formData.consignante} onValueChange={(value) => handleSelectChange("consignante", value)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Seleccione consignante" />
            </SelectTrigger>
            <SelectContent>
              {consignantes.map((consignante) => (
                <SelectItem key={consignante.id} value={consignante.id.toString()}>
                  {consignante.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="planilla" className="text-sm">
            Planilla
          </Label>
          <Input id="planilla" name="planilla" value={formData.planilla} onChange={handleChange} className="h-8" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="observaciones" className="text-sm">
            Recibos de báscula
          </Label>
          <Input
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            className="h-8"
            placeholder="Ingrese recibos de báscula"
          />
        </div>
      </div>

      {/* Sección de cantidades */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-lg" style={{ color: colors.text }}>
            Información de la Guía de Degüello
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
            Resumen de la Guía de Degüello
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
          consignante: consignantes.find((c) => c.id.toString() === formData.consignante)?.nombre || "N/A",
        }}
      />

      {/* Modal para crear un nuevo contacto */}
      <Dialog open={showCreateContactDialog} onOpenChange={setShowCreateContactDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo {contactType === "anterior" ? "Propietario" : "Nuevo Propietario"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="primer_nombre" className="text-sm">
                  Primer Nombre *
                </Label>
                <Input
                  id="primer_nombre"
                  name="primer_nombre"
                  value={newContactData.primer_nombre}
                  onChange={handleNewContactChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="segundo_nombre" className="text-sm">
                  Segundo Nombre
                </Label>
                <Input
                  id="segundo_nombre"
                  name="segundo_nombre"
                  value={newContactData.segundo_nombre}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="primer_apellido" className="text-sm">
                  Primer Apellido
                </Label>
                <Input
                  id="primer_apellido"
                  name="primer_apellido"
                  value={newContactData.primer_apellido}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="segundo_apellido" className="text-sm">
                  Segundo Apellido
                </Label>
                <Input
                  id="segundo_apellido"
                  name="segundo_apellido"
                  value={newContactData.segundo_apellido}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nit" className="text-sm">
                  NIT/Cédula *
                </Label>
                <Input id="nit" name="nit" value={newContactData.nit} onChange={handleNewContactChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono" className="text-sm">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={newContactData.telefono}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input id="email" name="email" value={newContactData.email} onChange={handleNewContactChange} />
              </div>

              {contactType === "nuevo" && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="marca" className="text-sm">
                      Marca
                    </Label>
                    <Input id="marca" name="marca" value={newContactData.marca} onChange={handleNewContactChange} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="imagen_url" className="text-sm">
                      Imagen de la Marca
                    </Label>
                    <ImageUpload
                      value={newContactData.imagen_url}
                      onChange={handleNewContactImageChange}
                      onRemove={() => handleNewContactImageChange("")}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <h3 className="font-medium mb-2">Información de Ubicación</h3>
              </div>

              <div className="space-y-1">
                <Label htmlFor="nombre_finca" className="text-sm">
                  Nombre de la Finca *
                </Label>
                <Input
                  id="nombre_finca"
                  name="nombre_finca"
                  value={newContactData.nombre_finca}
                  onChange={handleNewContactChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="direccion" className="text-sm">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={newContactData.direccion}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="id_departamento" className="text-sm">
                  Departamento *
                </Label>
                <Select
                  value={newContactData.id_departamento}
                  onValueChange={(value) => handleNewContactSelectChange("id_departamento", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((depto) => (
                      <SelectItem key={depto.id} value={depto.id.toString()}>
                        {depto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="id_municipio" className="text-sm">
                  Municipio *
                </Label>
                <Select
                  value={newContactData.id_municipio}
                  onValueChange={(value) => handleNewContactSelectChange("id_municipio", value)}
                  disabled={!newContactData.id_departamento || municipiosContacto.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !newContactData.id_departamento
                          ? "Seleccione primero un departamento"
                          : municipiosContacto.length === 0
                            ? "Cargando municipios..."
                            : "Seleccione municipio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosContacto.map((muni) => (
                      <SelectItem key={muni.id} value={muni.id.toString()}>
                        {muni.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="area_hectareas" className="text-sm">
                  Área (Hectáreas)
                </Label>
                <Input
                  id="area_hectareas"
                  name="area_hectareas"
                  type="number"
                  value={newContactData.area_hectareas}
                  onChange={handleNewContactChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="es_principal"
                  name="es_principal"
                  checked={newContactData.es_principal}
                  onChange={handleNewContactChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="es_principal" className="text-sm">
                  Establecer como ubicación principal
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateContactDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateContact} disabled={isCreatingContact}>
              {isCreatingContact ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Contacto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear una nueva ubicación para el dueño nuevo */}
      <Dialog open={showCreateUbicacionNuevoDialog} onOpenChange={setShowCreateUbicacionNuevoDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Ubicación para Nuevo Propietario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nombre_finca_nuevo" className="text-sm">
                  Nombre de la Finca *
                </Label>
                <Input
                  id="nombre_finca_nuevo"
                  name="nombre_finca"
                  value={newUbicacionNuevoData.nombre_finca}
                  onChange={(e) => setNewUbicacionNuevoData((prev) => ({ ...prev, nombre_finca: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="direccion_nuevo" className="text-sm">
                  Dirección
                </Label>
                <Input
                  id="direccion_nuevo"
                  name="direccion"
                  value={newUbicacionNuevoData.direccion}
                  onChange={(e) => setNewUbicacionNuevoData((prev) => ({ ...prev, direccion: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="id_departamento_nuevo" className="text-sm">
                  Departamento *
                </Label>
                <Select
                  value={newUbicacionNuevoData.id_departamento}
                  onValueChange={(value) => setNewUbicacionNuevoData((prev) => ({ ...prev, id_departamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((depto) => (
                      <SelectItem key={depto.id} value={depto.id.toString()}>
                        {depto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="id_municipio_nuevo" className="text-sm">
                  Municipio *
                </Label>
                <Select
                  value={newUbicacionNuevoData.id_municipio}
                  onValueChange={(value) => setNewUbicacionNuevoData((prev) => ({ ...prev, id_municipio: value }))}
                  disabled={!newUbicacionNuevoData.id_departamento || municipiosUbicacionNuevo.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !newUbicacionNuevoData.id_departamento
                          ? "Seleccione primero un departamento"
                          : municipiosUbicacionNuevo.length === 0
                            ? "Cargando municipios..."
                            : "Seleccione municipio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {municipiosUbicacionNuevo.map((muni) => (
                      <SelectItem key={muni.id} value={muni.id.toString()}>
                        {muni.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="area_hectareas_nuevo" className="text-sm">
                  Área (Hectáreas)
                </Label>
                <Input
                  id="area_hectareas_nuevo"
                  name="area_hectareas"
                  type="number"
                  value={newUbicacionNuevoData.area_hectareas}
                  onChange={(e) => setNewUbicacionNuevoData((prev) => ({ ...prev, area_hectareas: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="es_principal_nuevo"
                  name="es_principal"
                  checked={newUbicacionNuevoData.es_principal}
                  onChange={(e) => setNewUbicacionNuevoData((prev) => ({ ...prev, es_principal: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="es_principal_nuevo" className="text-sm">
                  Establecer como ubicación principal
                </Label>
              </div>

              {/* Añadir campos para marca e imagen */}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateUbicacionNuevoDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateUbicacionNuevo} disabled={isCreatingUbicacionNuevo}>
              {isCreatingUbicacionNuevo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Ubicación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
