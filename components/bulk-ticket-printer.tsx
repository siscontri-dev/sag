"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useState, useEffect, useRef } from "react"

// Tipo para los datos del ticket
interface TicketData {
  ticketNumber: number // Este será el código del animal (antiguo ticket)
  ticket2?: number // Este será el número de báscula
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPrinting, setIsPrinting] = useState(false)
  const [displayTickets, setDisplayTickets] = useState<TicketData[]>([])
  const [hasStartedPrinting, setHasStartedPrinting] = useState(false)
  const printingRef = useRef(false)

  // Efecto para procesar los tickets y asegurarse de que ticket2 sea válido
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const processedTickets = tickets.map((ticket) => {
        // Si ticket2 no existe o no es un número válido, usar ticketNumber como respaldo
        const validTicket2 =
          ticket.ticket2 !== undefined && ticket.ticket2 !== null && !isNaN(Number(ticket.ticket2))
            ? Number(ticket.ticket2)
            : Number(ticket.ticketNumber)

        return {
          ...ticket,
          ticket2: validTicket2,
        }
      })

      setDisplayTickets(processedTickets)
    } else {
      setDisplayTickets([])
    }
  }, [tickets])

  // URL correcta del logo
  const logoUrl = "https://i.postimg.cc/J7kB03bd/LOGO-SAG.png"

  // Función para imprimir el ticket actual
  const printCurrentTicket = () => {
    if (currentIndex >= displayTickets.length || printingRef.current) {
      return
    }

    // Marcar que estamos imprimiendo para evitar múltiples impresiones
    printingRef.current = true
    setIsPrinting(true)

    // Obtener el ticket actual
    const ticket = displayTickets[currentIndex]

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
            <title>Ticket #${ticket.ticket2}</title>
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
                <span>Nº ${ticket.ticket2}</span>
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
                <span>${ticket.pesoKg.toFixed(2)} kg</span>
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
          </body>
        </html>
      `)
      frameDoc.close()

      // Esperar a que se carguen las imágenes antes de imprimir
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()

          // Esperar a que se complete la impresión
          setTimeout(() => {
            // Eliminar el iframe
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame)
            }

            // Avanzar al siguiente ticket o finalizar
            if (currentIndex < displayTickets.length - 1) {
              setCurrentIndex(currentIndex + 1)
            } else {
              // Todos los tickets han sido impresos
              setIsPrinting(false)
              if (onComplete) {
                onComplete()
              }
            }

            // Desmarcar que estamos imprimiendo
            printingRef.current = false
          }, 1000)
        } catch (error) {
          console.error("Error al imprimir:", error)
          setIsPrinting(false)
          printingRef.current = false
        }
      }, 500)
    }
  }

  // Función segura para formatear moneda
  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return "0"
    }
    return amount.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
    })
  }

  // Efecto para imprimir automáticamente cuando cambia el índice actual
  useEffect(() => {
    if (open && !isPrinting && currentIndex < displayTickets.length && !hasStartedPrinting) {
      setHasStartedPrinting(true)
      printCurrentTicket()
    }
  }, [open, currentIndex, isPrinting, displayTickets.length, hasStartedPrinting])

  // Efecto para imprimir el siguiente ticket cuando se completa la impresión actual
  useEffect(() => {
    if (open && !isPrinting && currentIndex > 0 && currentIndex < displayTickets.length && hasStartedPrinting) {
      printCurrentTicket()
    }
  }, [open, currentIndex, isPrinting, displayTickets.length, hasStartedPrinting])

  // Reiniciar el estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setCurrentIndex(0)
      setIsPrinting(false)
      setHasStartedPrinting(false)
      printingRef.current = false
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Imprimiendo Tickets</span>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {displayTickets.length > 0 ? (
            <>
              <div className="text-center mb-4">
                <p className="text-lg font-medium">
                  Imprimiendo ticket {currentIndex + 1} de {displayTickets.length}
                </p>
                <p className="text-sm text-gray-500">
                  Por favor, no cierre esta ventana hasta que se complete la impresión.
                </p>
              </div>

              <div className className="bg-white p-4 rounded-lg border" style={{ width: "80mm", margin: "0 auto" }}>
                <div className="text-center mb-2">
                  <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-auto mx-auto mb-1" />
                </div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>

                {currentIndex < displayTickets.length && (
                  <>
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold">T.BASCULULA:</span> Nº {displayTickets[currentIndex].ticket2}
                      </div>
                      <div>
                        <span className="font-bold">VALOR:</span> $
                        {formatCurrency(displayTickets[currentIndex].valor || 6000)}
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">FECHA:</span> {displayTickets[currentIndex].fecha}
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">USUARIO:</span> {displayTickets[currentIndex].duenioAnterior}
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">CC/NIT:</span> {displayTickets[currentIndex].cedulaDuenio}
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="font-bold">{displayTickets[currentIndex].tipoAnimal.toUpperCase()}</span>
                      <div>
                        <span className="font-bold">COD:</span> {displayTickets[currentIndex].ticketNumber}
                      </div>
                      <div>
                        <span className="font-bold">PESO:</span> {displayTickets[currentIndex].pesoKg.toFixed(2)} kg
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    <div className="flex justify-between text-xs">
                      <div className="text-center w-1/3">
                        <div className="font-bold">RAZA</div>
                        <div>{displayTickets[currentIndex].raza}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-bold">COLOR</div>
                        <div>{displayTickets[currentIndex].color}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-bold">GENERO</div>
                        <div>{displayTickets[currentIndex].genero}</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="text-center text-[10px]">Sistema de Gestión de Bovinos y Porcinos</div>
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentIndex < displayTickets.length - 1) {
                      setCurrentIndex(currentIndex + 1)
                    } else {
                      onOpenChange(false)
                      if (onComplete) {
                        onComplete()
                      }
                    }
                  }}
                  disabled={isPrinting}
                >
                  {currentIndex < displayTickets.length - 1 ? "Siguiente Ticket" : "Finalizar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-medium">No hay tickets para imprimir</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
