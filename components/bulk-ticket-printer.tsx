"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipo para los datos del ticket
interface TicketData {
  ticketNumber: number
  ticket2?: number
  transaction_id?: number
  fecha: string
  duenioAnterior: string
  cedulaDuenio: string
  tipoAnimal: string
  sku: string
  pesoKg: number
  raza: string
  color: string
  genero: string
  valor?: number
}

// Propiedades del componente
interface BulkTicketPrinterProps {
  tickets: TicketData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export default function BulkTicketPrinter({ tickets, open, onOpenChange, onComplete }: BulkTicketPrinterProps) {
  const { toast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0)
  const [updatedTickets, setUpdatedTickets] = useState<TicketData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(open)

  // URL correcta del logo
  const logoUrl = "/images/logo-sag.png"

  // Modificar la función formatCurrency para que no muestre decimales y use comas para separar miles
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return "0"
    }
    // Usar toLocaleString en lugar de regex para evitar problemas de sintaxis
    return Math.round(amount).toLocaleString("es-CO")
  }

  // Función para obtener datos actualizados de los tickets si es necesario
  useEffect(() => {
    setIsOpen(open)
  }, [open])

  // Modificar la función handleOpenChange para llamar a onComplete cuando se cierra el diálogo
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)

    // Si se está cerrando el diálogo, llamar a onComplete
    if (!open && onComplete) {
      onComplete()
    }
  }

  useEffect(() => {
    if (isOpen && tickets.length > 0) {
      setIsLoading(true)
      setError(null)

      console.log("BulkTicketPrinter recibió tickets:", tickets)

      // Si los tickets ya tienen todos los datos necesarios, usarlos directamente
      if (tickets[0].ticket2 !== undefined && tickets[0].genero !== undefined) {
        console.log("Usando tickets proporcionados directamente")
        setUpdatedTickets(tickets)
        setIsLoading(false)
        return
      }

      // Si tenemos un ID de transacción, intentamos obtener datos actualizados
      if (tickets[0].transaction_id) {
        const fetchUpdatedTickets = async () => {
          try {
            console.log("Obteniendo datos actualizados para transacción:", tickets[0].transaction_id)
            const response = await fetch(`/api/tickets/get-by-transaction/${tickets[0].transaction_id}`)

            if (!response.ok) {
              throw new Error(`Error al obtener datos: ${response.status}`)
            }

            const data = await response.json()

            if (data.success && data.tickets && data.tickets.length > 0) {
              console.log("Datos actualizados de tickets:", data.tickets)

              // Mapear los datos actualizados al formato que espera el componente
              const updatedData = data.tickets.map((ticket) => {
                // Asegurarnos de que ticket2 sea un número
                const ticket2Value =
                  ticket.ticket2 !== undefined && ticket.ticket2 !== null
                    ? Number(ticket.ticket2)
                    : Number(ticket.ticket) // Si no hay ticket2, usar ticket como respaldo

                console.log(
                  `Ticket #${ticket.ticket} - T.BASCULA: ${ticket2Value} - Género: ${ticket.genero_nombre || "No definido"}`,
                )

                return {
                  ticketNumber: Number(ticket.ticket),
                  ticket2: ticket2Value,
                  transaction_id: ticket.transaction_id,
                  fecha: new Date().toLocaleString("es-CO"),
                  duenioAnterior: tickets[0].duenioAnterior, // Mantener datos del propietario
                  cedulaDuenio: tickets[0].cedulaDuenio,
                  tipoAnimal: ticket.product_name || tickets[0].tipoAnimal,
                  sku: ticket.product_id?.toString() || tickets[0].sku,
                  pesoKg: Number(ticket.quantity || 0),
                  raza: ticket.raza_nombre || "N/A",
                  color: ticket.color_nombre || "N/A",
                  genero: ticket.genero_nombre || "N/A", // Usar el nombre del género de la base de datos
                  valor: ticket.valor || 6000,
                }
              })

              setUpdatedTickets(updatedData)
            } else {
              throw new Error("No se encontraron tickets para esta transacción")
            }
          } catch (error) {
            console.error("Error al obtener datos actualizados:", error)
            setError(error instanceof Error ? error.message : "Error desconocido")

            // En caso de error, usar los datos originales pero asegurarnos de que ticket2 esté definido
            const fallbackData = tickets.map((ticket) => ({
              ...ticket,
              ticket2: ticket.ticket2 !== undefined ? ticket.ticket2 : Number(ticket.ticketNumber),
            }))
            setUpdatedTickets(fallbackData)
          } finally {
            setIsLoading(false)
          }
        }

        fetchUpdatedTickets()
      } else {
        // Si no hay ID de transacción, usar los datos originales pero asegurarnos de que ticket2 esté definido
        const fallbackData = tickets.map((ticket) => ({
          ...ticket,
          ticket2: ticket.ticket2 !== undefined ? ticket.ticket2 : Number(ticket.ticketNumber),
        }))
        setUpdatedTickets(fallbackData)
        setIsLoading(false)
      }
    }
  }, [isOpen, tickets])

  // Función para imprimir todos los tickets
  const printAllTickets = async () => {
    if (updatedTickets.length === 0) return

    setIsPrinting(true)
    setCurrentTicketIndex(0)

    // Imprimir el primer ticket
    await printTicket(0)
  }

  // Función para formatear números con comas como separadores de miles
  const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString("es-CO")
  }

  // Función para imprimir un ticket específico
  const printTicket = async (index: number) => {
    if (index >= updatedTickets.length) {
      // Hemos terminado de imprimir todos los tickets
      setIsPrinting(false)
      toast({
        title: "Impresión completada",
        description: `Se han impreso ${updatedTickets.length} tickets correctamente.`,
        variant: "success",
      })
      return
    }

    const ticket = updatedTickets[index]

    // Asegurarnos de que ticket2 tenga un valor
    const ticket2Value = ticket.ticket2 !== undefined ? ticket.ticket2 : ticket.ticketNumber

    console.log(`Imprimiendo ticket #${ticket.ticketNumber} - T.BASCULA: ${ticket2Value}`)

    // Crear un iframe oculto para la impresión
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"
    printFrame.id = `print-frame-${Date.now()}`

    document.body.appendChild(printFrame)

    // Escribir el contenido del ticket en el iframe
    const frameDoc = printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
      frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket #${ticket2Value}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            .ticket {
              padding: 5px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
            }
            .logo {
              width: 100%;
              height: auto;
              margin-bottom: 5px;
            }
            .title {
              font-size: 14px;
              font-weight: bold;
              margin: 5px 0;
            }
            .info {
              margin: 5px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td {
              padding: 2px 0;
            }
            .label {
              font-weight: bold;
            }
            .flex-row {
              display: flex;
              justify-content: space-between;
            }
            .three-columns {
              display: flex;
              justify-content: space-between;
              width: 100%;
            }
            .three-columns div {
              width: 33%;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <img src="${logoUrl}" alt="Logo" class="logo" onerror="this.onerror=null; this.src='/images/logo-sag.png';" />
            </div>
            <div class="divider"></div>
            
            <div class="flex-row">
              <span class="label">T.BASCULULA:</span>
              <span>Nº ${ticket2Value}</span>
              <span class="label">VALOR:</span>
              <span>$${formatCurrency(ticket.valor || 6000)}</span>
            </div>
            
            <div class="flex-row">
              <span class="label">FECHA:</span>
              <span>${ticket.fecha}</span>
            </div>
            
            <div class="flex-row">
              <span class="label">USUARIO:</span>
              <span>${ticket.duenioAnterior}</span>
            </div>
            
            <div class="flex-row">
              <span class="label">CC/NIT:</span>
              <span>${ticket.cedulaDuenio}</span>
            </div>
            
            <div class="flex-row">
              <span class="label">${ticket.tipoAnimal.toUpperCase()}</span>
              <span class="label">COD:</span>
              <span>${ticket.ticketNumber}</span>
              <span class="label">PESO:</span>
              <span>${formatNumber(Math.round(ticket.pesoKg))} kg</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="three-columns">
              <div>
                <div class="label">RAZA</div>
                <div>${ticket.raza}</div>
              </div>
              <div>
                <div class="label">COLOR</div>
                <div>${ticket.color}</div>
              </div>
              <div>
                <div class="label">GENERO</div>
                <div>${ticket.genero}</div>
              </div>
            </div>
            
            <div class="divider"></div>
            <div class="footer">
              Sistema de Gestión de Bovinos y Porcinos
            </div>
          </div>
          <script>
            // Detectar cuando la impresión se completa o se cancela
            window.addEventListener('afterprint', function() {
              window.parent.postMessage('printComplete', '*');
            });
          </script>
        </body>
      </html>
      `)
      frameDoc.close()

      // Agregar un listener para el mensaje de impresión completada
      const messageListener = (event) => {
        if (event.data === "printComplete") {
          // Eliminar el iframe
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame)
          }

          // Eliminar el listener
          window.removeEventListener("message", messageListener)

          // Actualizar el índice y continuar con el siguiente ticket
          setCurrentTicketIndex(index + 1)

          // Pequeña pausa antes de imprimir el siguiente ticket
          setTimeout(() => {
            printTicket(index + 1)
          }, 500)
        }
      }

      window.addEventListener("message", messageListener)

      // Esperar a que se carguen las imágenes antes de imprimir
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()

          // Si después de 10 segundos no se ha recibido el evento afterprint,
          // continuamos con el siguiente ticket (como respaldo)
          setTimeout(() => {
            if (currentTicketIndex === index) {
              console.log("No se recibió confirmación de impresión, continuando...")
              window.removeEventListener("message", messageListener)

              // Eliminar el iframe si aún existe
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame)
              }

              // Continuar con el siguiente ticket
              setCurrentTicketIndex(index + 1)
              printTicket(index + 1)
            }
          }, 10000)
        } catch (error) {
          console.error("Error al imprimir:", error)

          // Eliminar el iframe en caso de error
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame)
          }

          // Eliminar el listener
          window.removeEventListener("message", messageListener)

          // Continuar con el siguiente ticket a pesar del error
          setCurrentTicketIndex(index + 1)
          printTicket(index + 1)
        }
      }, 500)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Impresión de Tickets</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Obteniendo datos actualizados de los tickets...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <p>Se utilizarán los datos disponibles para la impresión.</p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <p className="mb-4">
                Se imprimirán {updatedTickets.length} tickets. Por favor, asegúrese de que la impresora esté conectada y
                lista.
              </p>

              {isPrinting && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    Imprimiendo ticket {currentTicketIndex + 1} de {updatedTickets.length}...
                  </p>
                  <div className="w-full bg-blue-200 h-2 mt-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full"
                      style={{
                        width: `${((currentTicketIndex + 1) / updatedTickets.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {updatedTickets.length > 0 && !isPrinting && (
                <div className="bg-white p-4 rounded-lg border shadow-sm" style={{ width: "80mm", margin: "0 auto" }}>
                  <div className="text-center mb-2">
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="w-full h-auto mx-auto mb-1"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = "/images/logo-sag.png"
                      }}
                    />
                  </div>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold">T.BASCULULA:</span> Nº{" "}
                      {updatedTickets[0].ticket2 !== undefined
                        ? updatedTickets[0].ticket2
                        : updatedTickets[0].ticketNumber}
                    </div>
                    <div>
                      <span className="font-bold">VALOR:</span> ${formatCurrency(updatedTickets[0].valor || 6000)}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold">FECHA:</span> {updatedTickets[0].fecha}
                  </div>

                  <div className="text-xs">
                    <span className="font-bold">USUARIO:</span> {updatedTickets[0].duenioAnterior}
                  </div>

                  <div className="text-xs">
                    <span className="font-bold">CC/NIT:</span> {updatedTickets[0].cedulaDuenio}
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{updatedTickets[0].tipoAnimal.toUpperCase()}</span>
                    <div>
                      <span className="font-bold">COD:</span> {updatedTickets[0].ticketNumber}
                    </div>
                    <div>
                      <span className="font-bold">PESO:</span> {formatNumber(Math.round(updatedTickets[0].pesoKg))} kg
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>

                  <div className="flex justify-between text-xs">
                    <div className="text-center w-1/3">
                      <div className="font-bold">RAZA</div>
                      <div>{updatedTickets[0].raza}</div>
                    </div>
                    <div className="text-center w-1/3">
                      <div className="font-bold">COLOR</div>
                      <div>{updatedTickets[0].color}</div>
                    </div>
                    <div className="text-center w-1/3">
                      <div className="font-bold">GENERO</div>
                      <div>{updatedTickets[0].genero}</div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  <div className="text-center text-[10px]">Sistema de Gestión de Bovinos y Porcinos</div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPrinting}>
                Cancelar
              </Button>
              <Button onClick={printAllTickets} disabled={isPrinting || updatedTickets.length === 0}>
                {isPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Imprimiendo...
                  </>
                ) : (
                  "Imprimir Tickets"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
