"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Printer, Loader2 } from "lucide-react"
import { useState } from "react"

// Tipo para los datos del ticket
interface TicketData {
  ticketNumber: number // Este será el código del animal (antiguo ticket)
  ticket2: number // Este será el número de báscula
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
  const [isPrinting, setIsPrinting] = useState(false)
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0)

  // URL correcta del logo
  const logoUrl = "https://i.postimg.cc/J7kB03bd/LOGO-SAG.png"

  const printAllTickets = async () => {
    setIsPrinting(true)
    setCurrentTicketIndex(0)

    try {
      for (let i = 0; i < tickets.length; i++) {
        setCurrentTicketIndex(i)
        await printTicket(tickets[i])
        // Pequeña pausa entre impresiones
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Llamar al callback de finalización si existe
      if (onComplete) {
        onComplete()
      } else {
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error al imprimir tickets:", error)
    } finally {
      setIsPrinting(false)
    }
  }

  const printTicket = (ticketData: TicketData): Promise<void> => {
    return new Promise((resolve, reject) => {
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
              <title>Ticket #${ticketData.ticket2}</title>
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
                  <span>Nº ${ticketData.ticket2}</span>
                  <span class="label">VALOR:</span>
                  <span>$${ticketData.valor || 6000}</span>
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
                  <span>${ticketData.ticketNumber}</span>
                  <span class="label">PESO:</span>
                  <span>${ticketData.pesoKg.toFixed(2)} kg</span>
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
                    <div>${ticketData.genero}</div>
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

            // Eliminar el iframe después de imprimir
            setTimeout(() => {
              document.body.removeChild(printFrame)
              resolve()
            }, 1000)
          } catch (error) {
            console.error("Error al imprimir:", error)
            reject(error)
          }
        }, 500)
      } else {
        reject(new Error("No se pudo crear el documento de impresión"))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Imprimir Tickets</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Se imprimirán {tickets.length} tickets. Por favor, asegúrese de que la impresora esté conectada y lista.
          </p>

          {isPrinting && (
            <div className="flex flex-col items-center justify-center gap-2 p-4 border rounded-md">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                Imprimiendo ticket {currentTicketIndex + 1} de {tickets.length}...
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPrinting}>
            Cancelar
          </Button>
          <Button onClick={printAllTickets} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Imprimiendo...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir todos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
