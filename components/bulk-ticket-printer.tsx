"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Printer } from "lucide-react"

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
}

// Propiedades del componente
interface BulkTicketPrinterProps {
  tickets: TicketData[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export default function BulkTicketPrinter({ tickets, open, onOpenChange, onComplete }: BulkTicketPrinterProps) {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0)

  // URL correcta del logo
  const logoUrl = "https://i.postimg.cc/J7kB03bd/LOGO-SAG.png"

  // Función para imprimir todos los tickets
  const printAllTickets = () => {
    // Crear un iframe oculto para la impresión
    const printFrame = document.createElement("iframe")
    printFrame.style.position = "fixed"
    printFrame.style.right = "0"
    printFrame.style.bottom = "0"
    printFrame.style.width = "0"
    printFrame.style.height = "0"
    printFrame.style.border = "0"

    document.body.appendChild(printFrame)

    // Escribir el contenido de todos los tickets en el iframe
    const frameDoc = printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
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
            ${tickets
              .map(
                (ticket) => `
              <div class="ticket">
                <div class="header">
                  <img src="${logoUrl}" alt="Logo" class="logo" />
                </div>
                <div class="divider"></div>
                
                <div class="flex-row">
                  <span class="label">T.BASCULULA:</span>
                  <span>Nº ${ticket.ticketNumber}</span>
                  <span class="label">VALOR:</span>
                  <span>$${ticket.valor || 6000}</span>
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
                  <span>${ticket.sku}</span>
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
            `,
              )
              .join("")}
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
          // Llamar al callback de completado si existe
          if (onComplete) {
            onComplete()
          }
          // Cerrar el diálogo
          onOpenChange(false)
        }, 1000)
      }, 500)
    }
  }

  // Función para imprimir solo el ticket actual
  const printCurrentTicket = () => {
    const ticket = tickets[currentTicketIndex]

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
            <title>Ticket #${ticket.ticketNumber}</title>
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
                <span>Nº ${ticket.ticketNumber}</span>
                <span class="label">VALOR:</span>
                <span>$${ticket.valor || 6000}</span>
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
                <span>${ticket.sku}</span>
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

  // Navegar al ticket anterior
  const prevTicket = () => {
    setCurrentTicketIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  // Navegar al ticket siguiente
  const nextTicket = () => {
    setCurrentTicketIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : prev))
  }

  // Si no hay tickets, no mostrar nada
  if (!tickets.length) return null

  // Obtener el ticket actual
  const currentTicket = tickets[currentTicketIndex]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            Vista previa de Tickets ({currentTicketIndex + 1} de {tickets.length})
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white p-4 rounded-lg border" style={{ width: "80mm", margin: "0 auto" }}>
          <div className="text-center mb-2">
            <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-auto mx-auto mb-1" />
          </div>
          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="flex justify-between text-xs">
            <div>
              <span className="font-bold">T.BASCULULA:</span> Nº {currentTicket.ticketNumber}
            </div>
            <div>
              <span className="font-bold">VALOR:</span> ${currentTicket.valor || 6000}
            </div>
          </div>

          <div className="text-xs">
            <span className="font-bold">FECHA:</span> {currentTicket.fecha}
          </div>

          <div className="text-xs">
            <span className="font-bold">USUARIO:</span> {currentTicket.duenioAnterior}
          </div>

          <div className="text-xs">
            <span className="font-bold">CC/NIT:</span> {currentTicket.cedulaDuenio}
          </div>

          <div className="flex justify-between text-xs">
            <span className="font-bold">{currentTicket.tipoAnimal.toUpperCase()}</span>
            <div>
              <span className="font-bold">COD:</span> {currentTicket.sku}
            </div>
            <div>
              <span className="font-bold">PESO:</span> {currentTicket.pesoKg.toFixed(2)} kg
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>

          <div className="flex justify-between text-xs">
            <div className="text-center w-1/3">
              <div className="font-bold">RAZA</div>
              <div>{currentTicket.raza}</div>
            </div>
            <div className="text-center w-1/3">
              <div className="font-bold">COLOR</div>
              <div>{currentTicket.color}</div>
            </div>
            <div className="text-center w-1/3">
              <div className="font-bold">GENERO</div>
              <div>{currentTicket.genero}</div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="text-center text-[10px]">Sistema de Gestión de Bovinos y Porcinos</div>
        </div>

        {/* Navegación entre tickets */}
        {tickets.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={prevTicket} disabled={currentTicketIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextTicket}
              disabled={currentTicketIndex === tickets.length - 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={printCurrentTicket}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir actual
            </Button>
            <Button onClick={printAllTickets}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir todos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
