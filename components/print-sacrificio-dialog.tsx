"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { NumeroALetras } from "@/lib/numero-a-letras"

// Tipo para los datos del documento
interface SacrificioDocData {
  numero_documento: string
  fecha_documento: string
  dueno_anterior: {
    nombre: string
    nit: string
    direccion?: string
  }
  dueno_nuevo: {
    nombre: string
    nit: string
    direccion?: string
  }
  cantidad_total: number
  cantidad_machos: number
  cantidad_hembras: number
  total_kilos: number
  colors: string
  tipo_animal: string
  impuestos: {
    deguello: number
    fedegan: number
    otros?: number
  }
  total: number
}

// Propiedades del componente
interface PrintSacrificioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: SacrificioDocData
  onComplete?: () => void
}

export default function PrintSacrificioDialog({ open, onOpenChange, data, onComplete }: PrintSacrificioDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  // Formatear la fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Convertir el total a letras
  const totalEnLetras = NumeroALetras(data.total)

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

    // Escribir el contenido del documento en el iframe
    const frameDoc = printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Liquidación Oficial - ${data.numero_documento}</title>
            <style>
              @page {
                size: 5.5in 8.5in; /* Media carta */
                margin: 0.5cm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.2;
                margin: 0;
                padding: 0;
              }
              .document {
                page-break-after: always;
                padding: 10px;
                max-width: 5.5in;
              }
              .header {
                text-align: center;
                margin-bottom: 10px;
              }
              .title {
                font-weight: bold;
                font-size: 12pt;
                margin: 5px 0;
              }
              .subtitle {
                font-size: 10pt;
                margin: 3px 0;
              }
              .section {
                margin: 10px 0;
                border: 1px solid #000;
                padding: 5px;
              }
              .section-title {
                font-weight: bold;
                background-color: #f0f0f0;
                padding: 3px;
                margin-bottom: 5px;
              }
              .row {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 3px;
              }
              .col {
                flex: 1;
              }
              .label {
                font-weight: bold;
                margin-right: 5px;
              }
              .value {
                flex: 2;
              }
              .liquidacion {
                width: 100%;
                border-collapse: collapse;
              }
              .liquidacion th, .liquidacion td {
                border: 1px solid #000;
                padding: 3px;
              }
              .footer {
                margin-top: 20px;
                display: flex;
                justify-content: space-between;
              }
              .signature {
                border-top: 1px solid #000;
                width: 45%;
                text-align: center;
                padding-top: 3px;
              }
              .guia-number {
                position: absolute;
                bottom: 20px;
                right: 20px;
                border: 1px solid #000;
                padding: 5px;
                font-weight: bold;
              }
              .copy-label {
                position: absolute;
                bottom: 10px;
                right: 20px;
                font-weight: bold;
                font-size: 14pt;
              }
            </style>
          </head>
          <body>
            <!-- ORIGINAL -->
            <div class="document">
              <div class="header">
                <div class="title">Municipio de Popayán</div>
                <div class="subtitle">NIT 891 580.006-4</div>
                <div class="subtitle">Régimen Común</div>
                <div class="subtitle">Edificio CAM Cr 6 No. 4-21</div>
                <div class="subtitle">Fax 6243370</div>
              </div>
              
              <div style="text-align: right;">
                <span class="label">Fecha:</span>
                <span>${formatDate(data.fecha_documento)}</span>
              </div>
              
              <div style="text-align: center; margin: 10px 0;">
                <div class="subtitle">Cta Ahorros $ 041 05586</div>
                <div class="title">Liquidación Oficial de Impuesto de degüello de Ganado Mayor y Menor</div>
                <div class="subtitle">Convenio inter-administrativo SAC del Cauca</div>
              </div>
              
              <div class="section">
                <div class="row">
                  <div class="col">
                    <span class="label">Solicitante:</span>
                    <span>${data.dueno_nuevo.nombre}</span>
                  </div>
                  <div class="col">
                    <span class="label">C.C.#</span>
                    <span>${data.dueno_nuevo.nit}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dirección:</span>
                    <span>${data.dueno_nuevo.direccion || "N/A"}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dueño Ant:</span>
                    <span>${data.dueno_anterior.nombre}</span>
                  </div>
                  <div class="col">
                    <span class="label">C.C.#</span>
                    <span>${data.dueno_anterior.nit}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dirección:</span>
                    <span>${data.dueno_anterior.direccion || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">AFILIACIÓN DEL ANIMAL</div>
                <div class="row">
                  <div class="col">
                    <span class="label">Cantidad:</span>
                    <span>${data.cantidad_total}</span>
                  </div>
                  <div class="col">
                    <span class="label">Tipo:</span>
                    <span>${data.tipo_animal}</span>
                  </div>
                  <div class="col">
                    <span class="label">Machos:</span>
                    <span>${data.cantidad_machos}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Peso:</span>
                    <span>${data.total_kilos} kg</span>
                  </div>
                  <div class="col">
                    <span class="label">Color:</span>
                    <span>${data.colors || "N/A"}</span>
                  </div>
                  <div class="col">
                    <span class="label">Marca:</span>
                    <span>N/A</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Señales Particulares:</span>
                    <span>N/A</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">LIQUIDACIÓN</div>
                <table class="liquidacion">
                  <tr>
                    <td><span class="label">Impuesto de Degüello $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.impuestos.deguello)}</td>
                  </tr>
                  <tr>
                    <td><span class="label">Impuesto de Fedegan $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.impuestos.fedegan)}</td>
                  </tr>
                  <tr>
                    <td><span class="label">TOTAL $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.total)}</td>
                  </tr>
                </table>
                <div class="row" style="margin-top: 10px;">
                  <div class="col">
                    <span class="label">Fechas de Báscula:</span>
                    <span>${formatDate(data.fecha_documento)}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">En Letras:</span>
                    <span>${totalEnLetras}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <div class="signature">
                  <div>Consignante</div>
                </div>
                <div class="signature">
                  <div>Liquidador</div>
                </div>
              </div>
              
              <div class="guia-number">
                GUIA DE DEGÜELLO N°<br/>
                ${data.numero_documento}
              </div>
              
              <div class="copy-label">ORIGINAL</div>
            </div>
            
            <!-- COPIA -->
            <div class="document">
              <div class="header">
                <div class="title">Municipio de Popayán</div>
                <div class="subtitle">NIT 891 580.006-4</div>
                <div class="subtitle">Régimen Común</div>
                <div class="subtitle">Edificio CAM Cr 6 No. 4-21</div>
                <div class="subtitle">Fax 6243370</div>
              </div>
              
              <div style="text-align: right;">
                <span class="label">Fecha:</span>
                <span>${formatDate(data.fecha_documento)}</span>
              </div>
              
              <div style="text-align: center; margin: 10px 0;">
                <div class="subtitle">Cta Ahorros $ 041 05586</div>
                <div class="title">Liquidación Oficial de Impuesto de degüello de Ganado Mayor y Menor</div>
                <div class="subtitle">Convenio inter-administrativo SAC del Cauca</div>
              </div>
              
              <div class="section">
                <div class="row">
                  <div class="col">
                    <span class="label">Solicitante:</span>
                    <span>${data.dueno_nuevo.nombre}</span>
                  </div>
                  <div class="col">
                    <span class="label">C.C.#</span>
                    <span>${data.dueno_nuevo.nit}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dirección:</span>
                    <span>${data.dueno_nuevo.direccion || "N/A"}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dueño Ant:</span>
                    <span>${data.dueno_anterior.nombre}</span>
                  </div>
                  <div class="col">
                    <span class="label">C.C.#</span>
                    <span>${data.dueno_anterior.nit}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Dirección:</span>
                    <span>${data.dueno_anterior.direccion || "N/A"}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">AFILIACIÓN DEL ANIMAL</div>
                <div class="row">
                  <div class="col">
                    <span class="label">Cantidad:</span>
                    <span>${data.cantidad_total}</span>
                  </div>
                  <div class="col">
                    <span class="label">Tipo:</span>
                    <span>${data.tipo_animal}</span>
                  </div>
                  <div class="col">
                    <span class="label">Machos:</span>
                    <span>${data.cantidad_machos}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Peso:</span>
                    <span>${data.total_kilos} kg</span>
                  </div>
                  <div class="col">
                    <span class="label">Color:</span>
                    <span>${data.colors || "N/A"}</span>
                  </div>
                  <div class="col">
                    <span class="label">Marca:</span>
                    <span>N/A</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">Señales Particulares:</span>
                    <span>N/A</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">LIQUIDACIÓN</div>
                <table class="liquidacion">
                  <tr>
                    <td><span class="label">Impuesto de Degüello $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.impuestos.deguello)}</td>
                  </tr>
                  <tr>
                    <td><span class="label">Impuesto de Fedegan $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.impuestos.fedegan)}</td>
                  </tr>
                  <tr>
                    <td><span class="label">TOTAL $</span></td>
                    <td style="text-align: right;">${formatCurrency(data.total)}</td>
                  </tr>
                </table>
                <div class="row" style="margin-top: 10px;">
                  <div class="col">
                    <span class="label">Fechas de Báscula:</span>
                    <span>${formatDate(data.fecha_documento)}</span>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <span class="label">En Letras:</span>
                    <span>${totalEnLetras}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <div class="signature">
                  <div>Consignante</div>
                </div>
                <div class="signature">
                  <div>Liquidador</div>
                </div>
              </div>
              
              <div class="guia-number">
                GUIA DE DEGÜELLO N°<br/>
                ${data.numero_documento}
              </div>
              
              <div class="copy-label">COPIA</div>
            </div>
          </body>
        </html>
      `)
      frameDoc.close()

      // Esperar a que se carguen las fuentes antes de imprimir
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
          setIsPrinting(false)
          if (onComplete) onComplete()
        }, 1000)
      }, 500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Vista previa del documento</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border rounded-lg p-4 max-h-[70vh] overflow-auto">
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg">Municipio de Popayán</h3>
            <p className="text-sm">NIT 891 580.006-4</p>
            <p className="text-sm">Régimen Común</p>
            <p className="text-sm">Edificio CAM Cr 6 No. 4-21</p>
            <p className="text-sm">Fax 6243370</p>
          </div>

          <div className="text-right mb-2">
            <span className="font-semibold">Fecha: </span>
            <span>{formatDate(data.fecha_documento)}</span>
          </div>

          <div className="text-center mb-4">
            <p className="text-sm">Cta Ahorros $ 041 05586</p>
            <h4 className="font-bold">Liquidación Oficial de Impuesto de degüello de Ganado Mayor y Menor</h4>
            <p className="text-sm">Convenio inter-administrativo SAC del Cauca</p>
          </div>

          <div className="border p-3 mb-4 rounded">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="font-semibold">Solicitante: </span>
                <span>{data.dueno_nuevo.nombre}</span>
              </div>
              <div>
                <span className="font-semibold">C.C.#: </span>
                <span>{data.dueno_nuevo.nit}</span>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Dirección: </span>
              <span>{data.dueno_nuevo.direccion || "N/A"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <span className="font-semibold">Dueño Ant: </span>
                <span>{data.dueno_anterior.nombre}</span>
              </div>
              <div>
                <span className="font-semibold">C.C.#: </span>
                <span>{data.dueno_anterior.nit}</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">Dirección: </span>
              <span>{data.dueno_anterior.direccion || "N/A"}</span>
            </div>
          </div>

          <div className="border p-3 mb-4 rounded">
            <h4 className="font-bold bg-gray-100 p-1 mb-2">AFILIACIÓN DEL ANIMAL</h4>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <span className="font-semibold">Cantidad: </span>
                <span>{data.cantidad_total}</span>
              </div>
              <div>
                <span className="font-semibold">Tipo: </span>
                <span>{data.tipo_animal}</span>
              </div>
              <div>
                <span className="font-semibold">Machos: </span>
                <span>{data.cantidad_machos}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <span className="font-semibold">Peso: </span>
                <span>{data.total_kilos} kg</span>
              </div>
              <div>
                <span className="font-semibold">Color: </span>
                <span>{data.colors || "N/A"}</span>
              </div>
              <div>
                <span className="font-semibold">Marca: </span>
                <span>N/A</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">Señales Particulares: </span>
              <span>N/A</span>
            </div>
          </div>

          <div className="border p-3 mb-4 rounded">
            <h4 className="font-bold bg-gray-100 p-1 mb-2">LIQUIDACIÓN</h4>
            <table className="w-full border-collapse mb-2">
              <tbody>
                <tr className="border">
                  <td className="border p-1 font-semibold">Impuesto de Degüello $</td>
                  <td className="border p-1 text-right">{formatCurrency(data.impuestos.deguello)}</td>
                </tr>
                <tr className="border">
                  <td className="border p-1 font-semibold">Impuesto de Fedegan $</td>
                  <td className="border p-1 text-right">{formatCurrency(data.impuestos.fedegan)}</td>
                </tr>
                <tr className="border">
                  <td className="border p-1 font-semibold">TOTAL $</td>
                  <td className="border p-1 text-right">{formatCurrency(data.total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mb-2">
              <span className="font-semibold">Fechas de Báscula: </span>
              <span>{formatDate(data.fecha_documento)}</span>
            </div>
            <div>
              <span className="font-semibold">En Letras: </span>
              <span>{totalEnLetras}</span>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <div className="border-t border-gray-400 w-[45%] text-center pt-1">
              <p>Consignante</p>
            </div>
            <div className="border-t border-gray-400 w-[45%] text-center pt-1">
              <p>Liquidador</p>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="border p-2 inline-block absolute right-0">
              <p className="font-bold">GUIA DE DEGÜELLO N°</p>
              <p className="text-center">{data.numero_documento}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={isPrinting}>
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? "Imprimiendo..." : "Imprimir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
