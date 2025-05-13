"use client"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { themeColors } from "@/lib/theme-config"
import { createUbication } from "@/app/contactos/actions"

// Necesitamos agregar los estados y funciones para manejar la creación de contactos
// Primero, asegúrate de que estas importaciones estén presentes:
import { createContact } from "@/app/contactos/actions"

export default function GuiaForm({
  contacts = [],
  products = [],
  tipoAnimal = "bovino",
  locationId = 1,
  razas = [],
  colores = [],
  guia = null,
}) {
  console.log("GuiaForm - Datos recibidos:", {
    tipoAnimal,
    locationId,
    guiaId: guia?.id,
    guiaType: guia?.type,
    dueno_anterior: guia?.id_dueno_anterior,
    dueno_anterior_nombre: guia?.dueno_anterior_nombre,
    lineasCount: guia?.transaction_lines?.length,
    ubication_contact_id: guia?.ubication_contact_id,
  })

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

  // Obtener la fecha actual en la zona horaria local (Bogotá/Lima)
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const formattedDate = `${year}-${month}-${day}`

  // Inicializar el formulario con la fecha actual
  const [formData, setFormData] = useState({
    numero_documento: guia?.numero_documento || "",
    fecha_documento: guia?.fecha_documento ? new Date(guia.fecha_documento).toISOString().split("T")[0] : formattedDate,
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
      raza_name: razas.find((r) => r.id === line.raza_id)?.name || "N/A",
      color_name: colores.find((c) => c.id === line.color_id)?.name || "N/A",
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

  // Inicializar el nombre del propietario si estamos editando
  useEffect(() => {
    if (guia && guia.id_dueno_anterior && guia.dueno_anterior_nombre) {
      // Buscar el contacto en la lista de contactos
      const contacto = contacts.find((c) => c.id.toString() === guia.id_dueno_anterior.toString())

      if (contacto) {
        // Si encontramos el contacto, usamos sus datos
        setSearchDuenoAnterior(`${contacto.primer_nombre} ${contacto.primer_apellido} - ${contacto.nit}`)
      } else {
        // Si no encontramos el contacto, usamos el nombre que viene en la guía
        setSearchDuenoAnterior(guia.dueno_anterior_nombre)
      }

      console.log("Inicializando propietario:", guia.dueno_anterior_nombre)
    }
  }, [guia, contacts])

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
            console.log("Fincas cargadas:", data)
            console.log("Finca seleccionada en guía:", guia?.ubication_contact_id)

            // Si hay fincas, seleccionar la predeterminada o la primera
            if (data.length > 0) {
              // Si estamos editando y hay una finca seleccionada en la guía
              if (guia && guia.ubication_contact_id) {
                setSelectedFinca(guia.ubication_contact_id.toString())
              } else {
                // Si no, seleccionar la finca principal o la primera
                const predeterminada = data.find((f) => f.es_principal)
                if (predeterminada) {
                  setSelectedFinca(predeterminada.id.toString())
                } else {
                  setSelectedFinca(data[0].id.toString())
                }
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
  }, [formData.id_dueno_anterior, guia])

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

  // Primero, añadir un nuevo estado para controlar si el botón "A" está bloqueado
  const [ticketButtonDisabled, setTicketButtonDisabled] = useState(false)

  // Modificar la función generateTicket para bloquear el botón after usarlo
  const handleGenerateTicket = async () => {
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

      // Bloquear el botón después de usarlo
      setTicketButtonDisabled(true)

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

  // Modificar la función handleAddLinea para resetear el estado del botón cuando se añade una línea
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
      raza_name: raza?.name || "Raza",
      \
