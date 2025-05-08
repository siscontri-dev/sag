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
import { PlusCircle, Trash, Loader2, Printer, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { themeColors } from "@/lib/theme-config"
import { createGuia, updateGuia } from "./actions"
// Añadir las importaciones de los componentes de impresión
import TicketPrinter from "@/components/ticket-printer"
import BulkTicketPrinter from "@/components/bulk-ticket-printer"

// Añadir importaciones necesarias para el modal de creación de fincas
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createUbication } from "@/app/contactos/actions"

// Necesitamos agregar los estados y funciones para manejar la creación de contactos
// Primero, asegúrate de que estas importaciones estén presentes:
import { createContact } from "@/app/contactos/actions"
import ImageUpload from "@/components/image-upload"

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
    business_location_id: locationId.toString(),
    estado: guia?.estado || "confirmado",
  })

  // Modificar el estado del formulario para incluir las fincas seleccionadas
  const [selectedFinca, setSelectedFinca] = useState(guia?.ubication_contact_id?.toString() || "")
  const [fincas, setFincas] = useState([])
  const [ubicacionesNuevo, setUbicacionesNuevo] = useState([])
  const [showCreateFincaDialog, setShowCreateFincaDialog] = useState(false)
  const [isLoadingFincas, setIsLoadingFincas] = useState(false)
  const [isLoadingUbicacionesNuevo, setIsLoadingUbicacionesNuevo] = useState(false)
  const [newFincaData, setNewFincaData] = useState({
    nombre_finca: "",
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    es_principal: false,
  })
  const [departamentos, setDepartamentos] = useState([])
  const [municipios, setMunicipios] = useState([])
  const [isCreatingFinca, setIsCreatingFinca] = useState(false)
  const [showNoUbicacionAlert, setShowNoUbicacionAlert] = useState(false)

  // Añadir estos estados para el diálogo de creación de contactos
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)
  const [contactType, setContactType] = useState(null) // "anterior" o "nuevo"
  const [showCreateUbicacionNuevoDialog, setShowCreateUbicacionNuevoDialog] = useState(false)
  const [newContactData, setNewContactData] = useState({
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    nit: "",
    telefono: "",
    email: "",
    type: 1, // Por defecto, dueño anterior
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
  // Modificar el estado de newUbicacionNuevoData para incluir marca e imagen_url
  const [newUbicacionNuevoData, setNewUbicacionNuevoData] = useState({
    nombre_finca: "",
    direccion: "",
    id_departamento: "",
    id_municipio: "",
    area_hectareas: "",
    es_principal: false,
  })
  const [isCreatingContact, setIsCreatingContact] = useState(false)
  const [isCreatingUbicacionNuevo, setIsCreatingUbicacionNuevo] = useState(false)
  const [municipiosUbicacionNuevo, setMunicipiosUbicacionNuevo] = useState([])
  const [municipiosContacto, setMunicipiosContacto] = useState([])
  const [selectedUbicacionNuevo, setSelectedUbicacionNuevo] = useState("")

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

  // Estados para el buscador de contactos
  const [searchDuenoAnterior, setSearchDuenoAnterior] = useState("")
  const [showDropdownAnterior, setShowDropdownAnterior] = useState(false)
  const [filteredContactosAnteriores, setFilteredContactosAnteriores] = useState([])
  const duenoAnteriorRef = useRef(null)

  // Agregar nuevos estados para el índice seleccionado
  const [selectedIndexAnterior, setSelectedIndexAnterior] = useState(-1)

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

  // Estado para generar ticket
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false)

  // Efecto para actualizar el precio del ticket cuando cambia el producto
  useEffect(() => {
    if (nuevaLinea.product_id) {
      const product = products.find((p) => p.id.toString() === nuevaLinea.product_id)
      setPrecioTicket(product ? product.price_ticket : 0)
    } else {
      setPrecioTicket(0)
    }
  }, [nuevaLinea.product_id, products])

  // Efecto para cargar departamentos cuando se abre el modal
  useEffect(() => {
    if (showCreateFincaDialog || showCreateContactDialog || showCreateUbicacionNuevoDialog) {
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
  }, [showCreateFincaDialog, showCreateContactDialog, showCreateUbicacionNuevoDialog])

  // Efecto para cargar municipios cuando cambia el departamento en finca
  useEffect(() => {
    if (newFincaData.id_departamento) {
      const fetchMunicipios = async () => {
        try {
          const response = await fetch(`/api/municipios/${newFincaData.id_departamento}`)
          if (response.ok) {
            const data = await response.json()
            // Asegurarnos de que estamos accediendo al array de municipios correctamente
            console.log("Respuesta de municipios:", data)
            setMunicipios(data.municipios || [])
          }
        } catch (error) {
          console.error("Error al cargar municipios:", error)
          setMunicipios([])
        }
      }
      fetchMunicipios()
    } else {
      setMunicipios([])
    }
  }, [newFincaData.id_departamento])

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

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (duenoAnteriorRef.current && !duenoAnteriorRef.current.contains(event.target)) {
        setShowDropdownAnterior(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Inicializar los contactos filtrados
  // Modificar los efectos para filtrar contactos correctamente según business_location_id
  // Reemplazar los efectos actuales (aproximadamente líneas 371-383) con estos:

  // Para filtrar contactos anteriores (propietarios)
  useEffect(() => {
    // Filtrar contactos según business_location_id
    // Si estamos en bovinos (tipoAnimal === "bovino"), mostrar contactos con business_location_id = 2
    // Si estamos en porcinos (tipoAnimal === "porcino"), mostrar contactos con business_location_id = 1
    const locationIdToFilter = tipoAnimal === "bovino" ? 2 : 1

    setFilteredContactosAnteriores(contacts.filter((contact) => contact.business_location_id === locationIdToFilter))
  }, [contacts, tipoAnimal])

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

  // Función para manejar la creación de una nueva finca
  const handleCreateFinca = async () => {
    if (!newFincaData.nombre_finca || !newFincaData.id_departamento || !newFincaData.id_municipio) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsCreatingFinca(true)
    try {
      // Crear un FormData para enviar los datos
      const fincaFormData = new FormData()
      fincaFormData.append("nombre_finca", newFincaData.nombre_finca)
      fincaFormData.append("direccion", newFincaData.direccion || "")
      fincaFormData.append("id_departamento", newFincaData.id_departamento)
      fincaFormData.append("id_municipio", newFincaData.id_municipio)
      fincaFormData.append("es_principal", newFincaData.es_principal ? "true" : "false")

      // Llamar a la función del servidor para crear la ubicación
      const contactId = Number(formData.id_dueno_anterior)
      const result = await createUbication(contactId, fincaFormData)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Finca creada correctamente",
        })

        // Recargar las fincas
        const response = await fetch(`/api/contactos/${formData.id_dueno_anterior}/ubicaciones`)
        if (response.ok) {
          const data = await response.json()
          setFincas(data)
          // Seleccionar la finca recién creada
          if (result.id) {
            setSelectedFinca(result.id.toString())
          }
        }

        // Cerrar el diálogo
        setShowCreateFincaDialog(false)
        // Limpiar el formulario
        setNewFincaData({
          nombre_finca: "",
          direccion: "",
          id_departamento: "",
          id_municipio: "",
          es_principal: false,
        })
      } else {
        throw new Error(result.message || "Error al crear la finca")
      }
    } catch (error) {
      console.error("Error al crear finca:", error)
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear la finca",
        variant: "destructive",
      })
    } finally {
      setIsCreatingFinca(false)
    }
  }

  // Función para manejar cambios en el formulario de nueva finca
  const handleNewFincaChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewFincaData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Función para manejar cambios en selects del formulario de nueva finca
  const handleNewFincaSelectChange = (name, value) => {
    setNewFincaData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Añadir esta función para manejar cambios en el formulario de nuevo contacto
  const handleNewContactChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewContactData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Función para manejar cambios en la imagen del contacto
  const handleNewContactImageChange = (imageUrl) => {
    setNewContactData((prev) => ({
      ...prev,
      imagen_url: imageUrl,
    }))
  }

  // Función para manejar cambios en selects del formulario de nuevo contacto
  const handleNewContactSelectChange = (name, value) => {
    setNewContactData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Añadir esta función para manejar la creación de un nuevo contacto
  const handleCreateContact = async () => {
    if (!newContactData.primer_nombre || !newContactData.nit) {
      toast({
        title: "Error",
        description: "Por favor complete los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    // Validar que se haya completado la información de ubicación
    if (!newContactData.nombre_finca || !newContactData.id_departamento || !newContactData.id_municipio) {
      toast({
        title: "Error",
        description: "Por favor complete la información de ubicación",
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
      contactFormData.append("type", contactType === "anterior" ? "1" : contactType === "nuevo" ? "2" : "3")

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
          type: contactType === "anterior" ? 1 : contactType === "nuevo" ? 2 : 3,
          marca: contactType === "nuevo" ? newContactData.marca || "" : "",
          imagen_url: contactType === "nuevo" ? newContactData.imagen_url || "" : "",
        }

        // Actualizar la lista de contactos
        contacts.push(nuevoContacto)

        // En la parte donde se actualiza el estado después de crear un contacto
        if (contactType === "anterior") {
          setFormData((prev) => ({ ...prev, id_dueno_anterior: result.contactId.toString() }))
          setSearchDuenoAnterior(
            `${nuevoContacto.primer_nombre} ${nuevoContacto.primer_apellido} - ${nuevoContacto.nit}`,
          )
          // Cargar las fincas del nuevo contacto
          const response = await fetch(`/api/contactos/${result.contactId}/ubicaciones`)
          if (response.ok) {
            const data = await response.json()
            setFincas(data)
            if (data.length > 0) {
              setSelectedFinca(data[0].id.toString())
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
          type: 1,
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

  // Añadir función para manejar la creación de una nueva ubicación para el dueño nuevo
  // Modificar la función handleCreateUbicacionNuevo para incluir marca e imagen_url

  // Modificar la función handleCreateUbicacionNuevo para incluir marca e imagen_url
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

  // Añadir esta función para manejar la apertura del diálogo de creación de contactos
  const handleOpenCreateContactDialog = (type) => {
    setContactType("anterior") // Solo permitimos "anterior"
    setNewContactData((prev) => ({
      ...prev,
      type: 1, // Siempre tipo 1 para dueño anterior
    }))
    setShowCreateContactDialog(true)
  }

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
        id_dueno_nuevo: null, // Ya no se usa
        total: totales.totalValor,
        estado: formData.estado || "confirmado",
        type: "entry",
        usuario_id: 1, // Usuario fijo mientras se desarrolla el login
        quantity_m: totalMachos, // Cantidad de animales machos
        quantity_h: totalHembras, // Cantidad de animales hembras
        quantity_k: totalKilos, // Total de kilos
        ubication_contact_id: selectedFinca ? Number(selectedFinca) : null, // Ubicación del dueño anterior
        ubication_contact_id2: null, // Ya no se usa
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

        {/* Modificar el selector de dueño anterior para agregar el botón + */}
        <div className="space-y-1 col-span-2 md:col-span-1">
          <div className="flex justify-between items-center">
            <Label htmlFor="id_dueno_anterior" className="text-sm">
              Propietario
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenCreateContactDialog("anterior")}
              className="h-6 px-2 text-xs"
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              Nuevo
            </Button>
          </div>
          <div className="relative" ref={duenoAnteriorRef}>
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
                const filtered = contacts
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

        {/* Selector de finca */}
        <div className="space-y-1 col-span-2 md:col-span-1">
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
                    Código
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
                        placeholder="Nº Código"
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

      {/* Modal para crear una nueva finca */}
      <Dialog open={showCreateFincaDialog} onOpenChange={setShowCreateFincaDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Finca</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nombre_finca" className="text-sm">
                  Nombre de la Finca *
                </Label>
                <Input
                  id="nombre_finca"
                  name="nombre_finca"
                  value={newFincaData.nombre_finca}
                  onChange={handleNewFincaChange}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="direccion" className="text-sm">
                  Dirección
                </Label>
                <Input id="direccion" name="direccion" value={newFincaData.direccion} onChange={handleNewFincaChange} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="id_departamento" className="text-sm">
                  Departamento *
                </Label>
                <Select
                  value={newFincaData.id_departamento}
                  onValueChange={(value) => handleNewFincaSelectChange("id_departamento", value)}
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
                  value={newFincaData.id_municipio}
                  onValueChange={(value) => handleNewFincaSelectChange("id_municipio", value)}
                  disabled={!newFincaData.id_departamento || municipios.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !newFincaData.id_departamento
                          ? "Seleccione primero un departamento"
                          : municipios.length === 0
                            ? "Cargando municipios..."
                            : "Seleccione municipio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((muni) => (
                      <SelectItem key={muni.id} value={muni.id.toString()}>
                        {muni.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="es_principal"
                  name="es_principal"
                  checked={newFincaData.es_principal}
                  onChange={handleNewFincaChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="es_principal" className="text-sm">
                  Establecer como finca principal
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateFincaDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateFinca} disabled={isCreatingFinca}>
              {isCreatingFinca ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Finca"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear un nuevo contacto */}
      <Dialog open={showCreateContactDialog} onOpenChange={setShowCreateContactDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Crear Nuevo{" "}
              {contactType === "anterior" ? "Propietario" : contactType === "nuevo" ? "Nuevo Propietario" : "Contacto"}
            </DialogTitle>
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
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newContactData.email}
                  onChange={handleNewContactChange}
                />
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
    </form>
  )
}
