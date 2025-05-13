"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import NumeroALetras from "@/lib/numero-a-letras"
import { formatDateDMY } from "@/lib/date-utils" // Importamos la función correctamente

// Tipo para los datos de la guía
interface GuiaDeguelloData {
  id: number
  fecha: string
  numero_documento: string
  dueno_anterior: {
    nombre: string
    nit: string
    direccion: string
  }
  dueno_nuevo?: {
    nombre: string
    nit: string
    direccion: string
  }
  cantidad: number
  tipo_animal: string
  machos: number
  hembras: number
  peso_total: number
  colores: string
  marca: string
  senales_particulares?: string
  impuesto_deguello: number
  impuesto_porcicultura: number
  total: number
  recibo_bascula?: string
  consignante?: string
  liquidador?: string
  afiliacion_animal?: string
  liquidacion?: string
}

// Propiedades del componente
interface PrintGuiaDeguelloProps {
  guia: GuiaDeguelloData
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

export default function PrintGuiaDeguello({ guia, open, onOpenChange, onComplete }: PrintGuiaDeguelloProps) {
  const { toast } = useToast()
  const [isPrinting, setIsPrinting] = useState(false)

  // Función para formatear la fecha
  const formatDate = (dateString: string): string => {
    // Usamos la función importada para formatear la fecha
    return formatDateDMY(dateString)
  }

  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Función para imprimir la guía
  const handlePrint = () => {
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

    // Escribir el contenido de la guía en el iframe
    const frameDoc = printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Guía de Degüello #${guia.numero_documento}</title>
            <style>
              @page {
                size: letter;
                margin: 0.5cm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.2;
                margin: 0;
                padding: 0;
              }
              .page {
                width: 21.59cm;
                height: 27.94cm;
                position: relative;
                page-break-after: always;
              }
              .half-page {
                width: 21cm;
                height: 13.5cm;
                border: 1px solid #000;
                box-sizing: border-box;
                padding: 0.5cm;
                position: relative;
              }
              .second-half {
                margin-top: 0.5cm;
              }
              .header {
                text-align: center;
                margin-bottom: 0.3cm;
              }
              .title {
                font-size: 14pt;
                font-weight: bold;
                margin-bottom: 0.2cm;
              }
              .subtitle {
                font-size: 12pt;
                font-weight: bold;
                margin-bottom: 0.2cm;
              }
              .info-row {
                display: flex;
                margin-bottom: 0.2cm;
              }
              .info-label {
                font-weight: bold;
                width: 30%;
              }
              .info-value {
                width: 70%;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.3cm 0;
              }
              .table th, .table td {
                border: 1px solid #000;
                padding: 0.1cm 0.2cm;
                text-align: left;
              }
              .table th {
                background-color: #f0f0f0;
              }
              .footer {
                position: absolute;
                bottom: 0.5cm;
                width: calc(100% - 1cm);
                text-align: center;
                font-size: 8pt;
              }
              .total-row {
                font-weight: bold;
              }
              .municipality-info {
                text-align: center;
                font-size: 8pt;
                margin-top: 0.3cm;
                border-top: 1px solid #000;
                padding-top: 0.2cm;
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5cm;
              }
              .signature {
                width: 45%;
                text-align: center;
              }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 1cm;
                padding-top: 0.2cm;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <!-- Primera copia -->
              <div class="half-page">
                <div class="header">
                  <div class="title">GUÍA DE DEGÜELLO Nº ${guia.numero_documento}</div>
                  <div class="subtitle">MUNICIPIO DE POPAYÁN</div>
                  <div>NIT 891.580.006-4</div>
                  <div>Convenio interadministrativo SAG CAUCA</div>
                  <div>Liquidación Oficial del Impuesto de degüello de Ganado Mayor y Menor</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Fecha:</div>
                  <div class="info-value">${formatDate(guia.fecha)}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Cta ahorros:</div>
                  <div class="info-value">041 85586</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Solicitante:</div>
                  <div class="info-value">${guia.dueno_nuevo?.nombre || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CC:</div>
                  <div class="info-value">${guia.dueno_nuevo?.nit || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dirección:</div>
                  <div class="info-value">${guia.dueno_nuevo?.direccion || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dueño Anterior:</div>
                  <div class="info-value">${guia.dueno_anterior.nombre}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CC:</div>
                  <div class="info-value">${guia.dueno_anterior.nit}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dirección:</div>
                  <div class="info-value">${guia.dueno_anterior.direccion}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CANTIDAD:</div>
                  <div class="info-value">${guia.cantidad} TIPO: ${guia.tipo_animal.toUpperCase()} MACHOS: ${guia.machos} PESO: ${guia.peso_total} COLOR: ${guia.colores} Marca: ${guia.marca}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Señales Particulares:</div>
                  <div class="info-value">${guia.senales_particulares || ""}</div>
                </div>
                
                <table class="table">
                  <tr>
                    <th>Concepto</th>
                    <th>Valor</th>
                  </tr>
                  <tr>
                    <td>Impuesto de Degüello</td>
                    <td>$${formatCurrency(guia.impuesto_deguello)}</td>
                  </tr>
                  <tr>
                    <td>Impuesto Porcicultura</td>
                    <td>$${formatCurrency(guia.impuesto_porcicultura)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>TOTAL</td>
                    <td>$${formatCurrency(guia.total)}</td>
                  </tr>
                </table>
                
                <div class="info-row">
                  <div class="info-label">RECIBO DE BÁSCULA:</div>
                  <div class="info-value">${guia.recibo_bascula || ""}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">EN LETRAS:</div>
                  <div class="info-value">${NumeroALetras(guia.total)}</div>
                </div>
                
                <div class="signatures">
                  <div class="signature">
                    <div class="signature-line">CONSIGNANTE</div>
                  </div>
                  <div class="signature">
                    <div class="signature-line">LIQUIDADOR</div>
                  </div>
                </div>
                
                <div class="municipality-info">
                  Edificio CAM Cra 6 Nº 4-21 - Fax 6242370 - Régimen Común
                </div>
              </div>
              
              <!-- Segunda copia (idéntica) -->
              <div class="half-page second-half">
                <div class="header">
                  <div class="title">GUÍA DE DEGÜELLO Nº ${guia.numero_documento}</div>
                  <div class="subtitle">MUNICIPIO DE POPAYÁN</div>
                  <div>NIT 891.580.006-4</div>
                  <div>Convenio interadministrativo SAG CAUCA</div>
                  <div>Liquidación Oficial del Impuesto de degüello de Ganado Mayor y Menor</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Fecha:</div>
                  <div class="info-value">${formatDate(guia.fecha)}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Cta ahorros:</div>
                  <div class="info-value">041 85586</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Solicitante:</div>
                  <div class="info-value">${guia.dueno_nuevo?.nombre || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CC:</div>
                  <div class="info-value">${guia.dueno_nuevo?.nit || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dirección:</div>
                  <div class="info-value">${guia.dueno_nuevo?.direccion || "N/A"}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dueño Anterior:</div>
                  <div class="info-value">${guia.dueno_anterior.nombre}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CC:</div>
                  <div class="info-value">${guia.dueno_anterior.nit}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Dirección:</div>
                  <div class="info-value">${guia.dueno_anterior.direccion}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">CANTIDAD:</div>
                  <div class="info-value">${guia.cantidad} TIPO: ${guia.tipo_animal.toUpperCase()} MACHOS: ${guia.machos} PESO: ${guia.peso_total} COLOR: ${guia.colores} Marca: ${guia.marca}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Señales Particulares:</div>
                  <div class="info-value">${guia.senales_particulares || ""}</div>
                </div>
                
                <table class="table">
                  <tr>
                    <th>Concepto</th>
                    <th>Valor</th>
                  </tr>
                  <tr>
                    <td>Impuesto de Degüello</td>
                    <td>$${formatCurrency(guia.impuesto_deguello)}</td>
                  </tr>
                  <tr>
                    <td>Impuesto Porcicultura</td>
                    <td>$${formatCurrency(guia.impuesto_porcicultura)}</td>
                  </tr>
                  <tr class="total-row">
                    <td>TOTAL</td>
                    <td>$${formatCurrency(guia.total)}</td>
                  </tr>
                </table>
                
                <div class="info-row">
                  <div class="info-label">RECIBO DE BÁSCULA:</div>
                  <div class="info-value">${guia.recibo_bascula || ""}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">EN LETRAS:</div>
                  <div class="info-value">${NumeroALetras(guia.total)}</div>
                </div>
                
                <div class="signatures">
                  <div class="signature">
                    <div class="signature-line">CONSIGNANTE</div>
                  </div>
                  <div class="signature">
                    <div class="signature-line">LIQUIDADOR</div>
                  </div>
                </div>
                
                <div class="municipality-info">
                  Edificio CAM Cra 6 Nº 4-21 - Fax 6242370 - Régimen Común
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.addEventListener('afterprint', function() {
                  window.parent.postMessage('printComplete', '*');
                });
              };
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

          // Actualizar el estado y notificar
          setIsPrinting(false)
          if (onComplete) {
            onComplete()
          }

          toast({
            title: "Impresión completada",
            description: "La guía de degüello se ha enviado a la impresora.",
          })
        }
      }

      window.addEventListener("message", messageListener)

      // Si después de 10 segundos no se ha recibido el evento afterprint,
      // asumimos que la impresión se completó o se canceló
      setTimeout(() => {
        if (isPrinting) {
          // Eliminar el iframe si aún existe
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame)
          }

          // Eliminar el listener
          window.removeEventListener("message", messageListener)

          // Actualizar el estado y notificar
          setIsPrinting(false)
          if (onComplete) {
            onComplete()
          }
        }
      }, 10000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Imprimir Guía de Degüello</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-amber-800 mb-2">Información de la Guía</h3>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Número:</span> {guia.numero_documento}
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Fecha:</span> {formatDate(guia.fecha)}
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Propietario:</span> {guia.dueno_anterior.nombre}
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Cantidad:</span> {guia.cantidad} {guia.tipo_animal}(s)
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-semibold">Total:</span> ${formatCurrency(guia.total)}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Información de Impresión</h3>
            <p className="text-sm text-blue-700 mb-2">
              Se imprimirán dos copias de la guía de degüello en una hoja tamaño carta.
            </p>
            <p className="text-sm text-blue-700">
              Asegúrese de que la impresora esté conectada y configurada correctamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPrinting}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Imprimiendo...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Guía
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
