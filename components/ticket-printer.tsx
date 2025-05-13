"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useState } from "react"

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
interface TicketPrinterProps {
  ticketData: TicketData
}

export default function TicketPrinter({ ticketData }: TicketPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  // URL correcta del logo
  const logoUrl = "https://i.postimg.cc/J7kB03bd/LOGO-SAG.png"

  // Función para imprimir el ticket
  const printTicket = () => {
    setIsPrinting(true)

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
            <title>Ticket #${ticketData.ticket2 || ticketData.ticketNumber}</title>
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
                <span>Nº ${ticketData.ticket2 || ticketData.ticketNumber}</span>
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

          // Esperar a que se complete la impresión
          const checkPrintingComplete = () => {
            if (printFrame.contentWindow?.document.readyState === "complete") {
              // Eliminar el iframe
              document.body.removeChild(printFrame)
              setIsPrinting(false)
            } else {
              setTimeout(checkPrintingComplete, 100)
            }
          }

          checkPrintingComplete()
        } catch (error) {
          console.error("Error al imprimir:", error)
          setIsPrinting(false)
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

  return (
    <Button variant="ghost" size="icon" onClick={printTicket} disabled={isPrinting} title="Imprimir ticket">
      <Printer className="h-4 w-4" />
    </Button>
  )
}
