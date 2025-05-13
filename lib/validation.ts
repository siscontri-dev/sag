// Funciones de validación para el sistema de guías y tickets

/**
 * Valida un número de documento
 * @param numero Número de documento a validar
 * @returns Objeto con resultado de validación
 */
export function validarNumeroDocumento(numero: string) {
  if (!numero || numero.trim() === "") {
    return { valido: false, mensaje: "El número de documento es requerido" }
  }

  // Verificar que no tenga caracteres especiales excepto guiones y puntos
  if (!/^[a-zA-Z0-9\-.]+$/.test(numero)) {
    return { valido: false, mensaje: "El número de documento contiene caracteres no permitidos" }
  }

  return { valido: true, mensaje: "" }
}

/**
 * Valida un número de ticket
 * @param ticket Número de ticket a validar
 * @returns Objeto con resultado de validación
 */
export function validarTicket(ticket: string) {
  if (!ticket || ticket.trim() === "") {
    return { valido: false, mensaje: "El número de ticket es requerido" }
  }

  // Verificar que sea un número
  if (!/^\d+$/.test(ticket)) {
    return { valido: false, mensaje: "El número de ticket debe ser un número entero" }
  }

  return { valido: true, mensaje: "" }
}

/**
 * Valida un valor de peso en kilos
 * @param kilos Valor de kilos a validar
 * @returns Objeto con resultado de validación
 */
export function validarKilos(kilos: string) {
  if (!kilos || kilos.trim() === "") {
    return { valido: false, mensaje: "El peso en kilos es requerido" }
  }

  // Convertir a número
  const kilosNum = Number(kilos)

  // Verificar que sea un número válido
  if (isNaN(kilosNum)) {
    return { valido: false, mensaje: "El peso debe ser un número válido" }
  }

  // Verificar que sea mayor que cero
  if (kilosNum <= 0) {
    return { valido: false, mensaje: "El peso debe ser mayor que cero" }
  }

  return { valido: true, mensaje: "" }
}

/**
 * Valida un contacto (propietario)
 * @param contactId ID del contacto a validar
 * @returns Objeto con resultado de validación
 */
export function validarContacto(contactId: string) {
  if (!contactId || contactId.trim() === "") {
    return { valido: false, mensaje: "El propietario es requerido" }
  }

  // Verificar que sea un número
  if (!/^\d+$/.test(contactId)) {
    return { valido: false, mensaje: "ID de propietario inválido" }
  }

  return { valido: true, mensaje: "" }
}

/**
 * Valida una fecha de documento
 * @param fecha Fecha a validar (formato YYYY-MM-DD)
 * @returns Objeto con resultado de validación
 */
export function validarFechaDocumento(fecha: string) {
  if (!fecha || fecha.trim() === "") {
    return { valido: false, mensaje: "La fecha del documento es requerida" }
  }

  // Verificar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { valido: false, mensaje: "El formato de fecha debe ser YYYY-MM-DD" }
  }

  // Verificar que sea una fecha válida
  const fechaObj = new Date(fecha)
  if (isNaN(fechaObj.getTime())) {
    return { valido: false, mensaje: "La fecha no es válida" }
  }

  // Verificar que no sea una fecha futura
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999) // Final del día actual
  if (fechaObj > hoy) {
    return { valido: false, mensaje: "La fecha no puede ser futura" }
  }

  return { valido: true, mensaje: "" }
}

/**
 * Valida las líneas de una guía
 * @param lineas Array de líneas de la guía
 * @returns Objeto con resultado de validación
 */
export function validarLineasGuia(lineas: any[]) {
  if (!lineas || lineas.length === 0) {
    return { valido: false, mensaje: "Debe agregar al menos una línea a la guía" }
  }

  // Verificar que no haya tickets duplicados
  const tickets = lineas.map((linea) => linea.ticket)
  const ticketsUnicos = new Set(tickets)
  if (tickets.length !== ticketsUnicos.size) {
    return { valido: false, mensaje: "Hay números de ticket duplicados" }
  }

  return { valido: true, mensaje: "" }
}
