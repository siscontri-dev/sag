"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

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
  const [displayTickets, setDisplayTickets] = useState<TicketData[]>([])
  const [hasPrinted, setHasPrinted] = useState(false)
  const printFrameRef = useRef<HTMLIFrameElement | null>(null)
  const router = useRouter()

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

  // Función para imprimir todos los tickets de una vez
  const printAllTickets = () => {
    if (displayTickets.length === 0 || hasPrinted) return

    // Crear un iframe oculto para la impresión
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"
    printFrameRef.current = printFrame

    document.body.appendChild(printFrame)

    // Escribir el contenido de todos los tickets en el iframe
    const frameDoc = printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()

      // Escribir el encabezado HTML
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tickets</title>
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
                page-break-after: always;
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
      `)

      // Escribir cada ticket
      displayTickets.forEach((ticket) => {
        frameDoc.write(`
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
        `)
      })

      // Cerrar el documento HTML
      frameDoc.write(`
          </body>
        </html>
      `)
      frameDoc.close()

      // Esperar a que se carguen las imágenes antes de imprimir
      setTimeout(() => {
        try {
          // Marcar como impreso para evitar múltiples impresiones
          setHasPrinted(true)

          printFrame.contentWindow?.focus()
          printFrame.contentWindow?.print()

          // Forzar la redirección después de imprimir
          setTimeout(() => {
            // Eliminar el iframe
            if (printFrame && document.body.contains(printFrame)) {
              document.body.removeChild(printFrame)
            }

            // Llamar a onComplete si existe
            if (onComplete) {
              onComplete()
            }

            // Cerrar el diálogo
            onOpenChange(false)

            // Forzar la redirección a la página de nueva guía
            router.push("/guias/nueva")
          }, 500)
        } catch (error) {
          console.error("Error al imprimir:", error)

          // En caso de error, también llamamos a onComplete
          if (onComplete) {
            onComplete()
          }

          // Cerrar el diálogo
          onOpenChange(false)

          // Forzar la redirección
          router.push("/guias/nueva")
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

  // Efecto para imprimir automáticamente cuando se abre el diálogo
  useEffect(() => {
    if (open && displayTickets.length > 0 && !hasPrinted) {
      // Pequeño retraso para asegurar que el diálogo esté completamente abierto
      const timer = setTimeout(() => {
        printAllTickets()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [open, displayTickets, hasPrinted])

  // Reiniciar el estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setHasPrinted(false)
    } else {
      // Limpiar cualquier iframe que pueda haber quedado
      if (printFrameRef.current && document.body.contains(printFrameRef.current)) {
        document.body.removeChild(printFrameRef.current)
      }
    }
  }, [open])

  // Manejar el cierre del diálogo
  const handleClose = () => {
    // Llamar a onComplete si existe
    if (onComplete) {
      onComplete()
    }

    // Cerrar el diálogo
    onOpenChange(false)

    // Forzar la redirección inmediata a la página de nueva guía
    router.push("/guias/nueva")
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Imprimiendo Tickets</span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {displayTickets.length > 0 ? (
            <>
              <div className="text-center mb-4">
                <p className="text-lg font-medium">
                  {hasPrinted ? "Tickets enviados a impresión" : "Preparando tickets para imprimir..."}
                </p>
                <p className="text-sm text-gray-500">
                  {hasPrinted
                    ? "Puede cerrar esta ventana después de imprimir."
                    : "Por favor, espere mientras se preparan los tickets..."}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border" style={{ width: "80mm", margin: "0 auto" }}>
                <div className="text-center mb-2">
                  <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-auto mx-auto mb-1" />
                </div>
                <div className="border-t border-dashed border-gray-400 my-2"></div>

                {displayTickets.length > 0 && (
                  <>
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold">T.BASCULULA:</span> Nº {displayTickets[0].ticket2}
                      </div>
                      <div>
                        <span className="font-bold">VALOR:</span> ${formatCurrency(displayTickets[0].valor || 6000)}
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">FECHA:</span> {displayTickets[0].fecha}
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">USUARIO:</span> {displayTickets[0].duenioAnterior}
                    </div>

                    <div className="text-xs">
                      <span className="font-bold">CC/NIT:</span> {displayTickets[0].cedulaDuenio}
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="font-bold">{displayTickets[0].tipoAnimal.toUpperCase()}</span>
                      <div>
                        <span className="font-bold">COD:</span> {displayTickets[0].ticketNumber}
                      </div>
                      <div>
                        <span className="font-bold">PESO:</span> {displayTickets[0].pesoKg.toFixed(2)} kg
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 my-2"></div>

                    <div className="flex justify-between text-xs">
                      <div className="text-center w-1/3">
                        <div className="font-bold">RAZA</div>
                        <div>{displayTickets[0].raza}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-bold">COLOR</div>
                        <div>{displayTickets[0].color}</div>
                      </div>
                      <div className="text-center w-1/3">
                        <div className="font-bold">GENERO</div>
                        <div>{displayTickets[0].genero}</div>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="text-center text-[10px]">Sistema de Gestión de Bovinos y Porcinos</div>
              </div>

              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={handleClose}>
                  {hasPrinted ? "Cerrar" : "Imprimir y Cerrar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-lg font-medium">No hay tickets para imprimir</p>
              <Button variant="outline" onClick={handleClose} className="mt-4">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
