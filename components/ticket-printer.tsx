"use client"

import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Tipo para los datos del ticket
interface TicketData {
  ticketNumber: number
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
  ticket2?: number
  transaction_id?: number // Añadimos el ID de la transacción para buscar directamente
}

// Propiedades del componente
interface TicketPrinterProps {
  ticketData: TicketData
  buttonLabel?: string
  buttonVariant?: "default" | "outline" | "ghost"
  buttonSize?: "default" | "sm" | "lg" | "icon"
}

export default function TicketPrinter({
  ticketData,
  buttonLabel = "",
  buttonVariant = "ghost",
  buttonSize = "icon",
}: TicketPrinterProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reemplazar la función fetchTicketData con esta versión mejorada
  const fetchTicketData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Si tenemos un ID de transacción, intentar obtener los datos del ticket por transacción
      if (ticketData.transaction_id) {
        try {
          console.log("Obteniendo datos por transacción:", ticketData.transaction_id)
          const response = await fetch(`/api/tickets/get-by-transaction/${ticketData.transaction_id}`)

          if (!response.ok) {
            throw new Error(`Error al obtener datos: ${response.status}`)
          }

          const data = await response.json()

          if (data.success && data.tickets && data.tickets.length > 0) {
            // Buscar el ticket específico por su número
            const ticketFound = data.tickets.find((t) => Number(t.ticket) === Number(ticketData.ticketNumber))

            if (ticketFound) {
              console.log("Ticket encontrado en la transacción:", ticketFound)

              // Asegurarnos de que ticket2 sea un número
              const ticket2Value =
                ticketFound.ticket2 !== undefined && ticketFound.ticket2 !== null
                  ? Number(ticketFound.ticket2)
                  : Number(ticketFound.ticket) // Si no hay ticket2, usar ticket como respaldo

              console.log(
                `Ticket #${ticketFound.ticket} - T.BASCULA: ${ticket2Value} - Género: ${ticketFound.genero_nombre || "No definido"}`,
              )

              setTicketInfo({
                ...ticketData,
                ticket: Number(ticketFound.ticket),
                ticket2: ticket2Value,
                genero: ticketFound.genero_nombre || ticketData.genero, // Usar el nombre del género de la base de datos
                _source: "transaction_data",
              })
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.error("Error al obtener datos por transacción:", err)
          // Continuar con el siguiente método si este falla
        }
      }

      // Si no se encontró por transacción o no hay ID de transacción, intentar obtener por número de ticket
      try {
        console.log("Obteniendo datos por número de ticket:", ticketData.ticketNumber)
        const response = await fetch(`/api/tickets/get-single/${ticketData.ticketNumber}`)

        if (!response.ok) {
          throw new Error(`Error al obtener datos: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.ticket) {
          console.log("Datos obtenidos directamente de la base de datos:", data.ticket)

          // Asegurarnos de que ticket2 sea un número
          const ticket2Value =
            data.ticket.ticket2 !== undefined && data.ticket.ticket2 !== null
              ? Number(data.ticket.ticket2)
              : Number(data.ticket.ticket) // Si no hay ticket2, usar ticket como respaldo

          console.log(
            `Ticket #${data.ticket.ticket} - T.BASCULA: ${ticket2Value} - Género: ${data.ticket.genero_nombre || "No definido"}`,
          )

          setTicketInfo({
            ...ticketData,
            ticket: Number(data.ticket.ticket),
            ticket2: ticket2Value,
            genero: data.ticket.genero_nombre || ticketData.genero, // Usar el nombre del género de la base de datos
            _source: "direct_data",
          })
          return
        } else {
          throw new Error(data.message || "No se encontraron datos del ticket")
        }
      } catch (err) {
        console.error("Error al obtener datos por número de ticket:", err)
        throw err // Re-lanzar para el manejo final
      }
    } catch (err) {
      console.error("Error al obtener datos del ticket:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      // Si hay un error, usar los datos originales
      const ticket2Value = ticketData.ticket2 !== undefined ? ticketData.ticket2 : ticketData.ticketNumber
      setTicketInfo({
        ...ticketData,
        ticket: ticketData.ticketNumber,
        ticket2: ticket2Value,
        _source: "original_fallback",
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtener datos actualizados cuando se abre el diálogo
  useEffect(() => {
    if (showPreview) {
      fetchTicketData()
    }
  }, [showPreview])

  // URL correcta del logo
  const logoUrl = "https://i.postimg.cc/J7kB03bd/LOGO-SAG.png"

  // Función para imprimir el ticket directamente
  const printTicket = () => {
    if (!ticketInfo) return

    // Asegurarnos de que ticket2 tenga un valor
    const ticket2Value = ticketInfo.ticket2 !== undefined ? ticketInfo.ticket2 : ticketInfo.ticket

    console.log(`Imprimiendo ticket #${ticketInfo.ticket} - T.BASCULA: ${ticket2Value}`)

    // Crear un iframe oculto para la impresión
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"

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
                <img src="${logoUrl}" alt="Logo" class="logo" />
              </div>
              <div class="divider"></div>
              
              <div class="flex-row">
                <span class="label">T.BASCULULA:</span>
                <span>Nº ${ticket2Value}</span>
                <span class="label">VALOR:</span>
                <span>$${formatCurrency(ticketData.valor || 6000)}</span>
              </div>
              
              <div class="flex-row">
                <span class="label">FECHA:</span>
                <span>${ticketData.fecha}</span>
              </div>
              
              <div class="flex-row">
                <span class="label">USUARIO:</span>
                <span>${ticketData.duenioAnterior}</span>
              </div>
              
              <div class="flex-row">
                <span class="label">CC/NIT:</span>
                <span>${ticketData.cedulaDuenio}</span>
              </div>
              
              <div class="flex-row">
                <span class="label">${ticketData.tipoAnimal.toUpperCase()}</span>
                <span class="label">COD:</span>
                <span>${ticketInfo.ticket}</span>
                <span class="label">PESO:</span>
                <span>${Math.round(ticketData.pesoKg)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} kg</span>
              </div>
              
              <div class="divider"></div>
              
              <div class="three-columns">
                <div>
                  <div class="label">RAZA</div>
                  <div>${ticketData.raza}</div>
                </div>
                <div>
                  <div class="label">COLOR</div>
                  <div>${ticketData.color}</div>
                </div>
                <div>
                  <div class="label">GENERO</div>
                  <div>${ticketInfo.genero}</div>
                </div>
              </div>
              
              <div class="divider"></div>
              <div class="footer">
                Sistema de Gestión de Bovinos y Porcinos
              </div>
            </div>
          </body>
        </html>
      `)
      frameDoc.close()

      // Esperar a que se carguen las imágenes antes de imprimir
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()
        } catch (error) {
          console.error("Error al imprimir:", error)
        }

        // Eliminar el iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 500)
    }
  }

  // Función segura para formatear moneda
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return "0"
    }
    return Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  return (
    <>
      <Button variant={buttonVariant} size={buttonSize} onClick={() => setShowPreview(true)} title="Imprimir ticket">
        <Printer className="h-4 w-4" />
        {buttonLabel}
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{loading ? "Cargando datos..." : `Vista previa del Ticket`}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Obteniendo los datos más recientes del ticket...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              <p>Error: {error}</p>
              <Button className="mt-4" onClick={fetchTicketData}>
                Reintentar
              </Button>
            </div>
          ) : ticketInfo ? (
            <>
              <div className="bg-white p-4 rounded-lg border" style={{ width: "80mm", margin: "0 auto" }}>
                <div className="text-center mb-2">
                  <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-auto mx-auto mb-1" />
                </div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>

                <div className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold">T.BASCULULA:</span> Nº{" "}
                    {ticketInfo.ticket2 !== undefined ? ticketInfo.ticket2 : ticketInfo.ticket}
                  </div>
                  <div>
                    <span className="font-bold">VALOR:</span> ${formatCurrency(ticketData.valor || 6000)}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="font-bold">FECHA:</span> {ticketData.fecha}
                </div>

                <div className="text-xs">
                  <span className="font-bold">USUARIO:</span> {ticketData.duenioAnterior}
                </div>

                <div className="text-xs">
                  <span className="font-bold">CC/NIT:</span> {ticketData.cedulaDuenio}
                </div>

                <div className="flex justify-between text-xs">
                  <span className="font-bold">{ticketData.tipoAnimal.toUpperCase()}</span>
                  <div>
                    <span className="font-bold">COD:</span> {ticketInfo.ticket}
                  </div>
                  <div>
                    <span className="font-bold">PESO:</span>{" "}
                    {Math.round(ticketData.pesoKg)
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                    kg
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-2"></div>

                <div className="flex justify-between text-xs">
                  <div className="text-center w-1/3">
                    <div className="font-bold">RAZA</div>
                    <div>{ticketData.raza}</div>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="font-bold">COLOR</div>
                    <div>{ticketData.color}</div>
                  </div>
                  <div className="text-center w-1/3">
                    <div className="font-bold">GENERO</div>
                    <div>{ticketInfo.genero}</div>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="text-center text-[10px]">Sistema de Gestión de Bovinos y Porcinos</div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Cancelar
                </Button>
                <Button onClick={printTicket}>Imprimir</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
