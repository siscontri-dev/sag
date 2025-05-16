"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface PrintBoletinSimpleDialogProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
  totalDeguello: number
  totalServicioMatadero: number
  totalFedegan: number
  totalGeneral: number
  totalCantidad: number
  totalMachos: number
  totalHembras: number
  boletinNumber: string
}

export function PrintBoletinSimpleDialog({
  isOpen,
  onClose,
  data,
  totalDeguello,
  totalServicioMatadero,
  totalFedegan,
  totalGeneral,
  totalCantidad,
  totalMachos,
  totalHembras,
  boletinNumber,
}: PrintBoletinSimpleDialogProps) {
  const [loading, setLoading] = useState(false)

  const handlePrint = async () => {
    try {
      setLoading(true)

      // Preparar los datos para la API
      const exportData = {
        title: `CONVENIO MUNICIPIO DE POPAYAN - SAG CAUCA\nBOLETIN MOVIMIENTO DE GANADO MAYOR(BOVINOS)`,
        data,
        boletinNumber,
        totals: {
          totalDeguello,
          totalServicioMatadero,
          totalFedegan,
          totalGeneral,
          totalCantidad,
          totalMachos,
          totalHembras,
        },
      }

      // Llamar a la API para generar el PDF
      const response = await fetch(`/api/export/boletin-simple-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        throw new Error(`Error al generar PDF: ${response.status}`)
      }

      // Obtener el blob del archivo PDF
      const blob = await response.blob()

      // Crear un enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `Boletin_Movimiento_Ganado_Mayor_${boletinNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)

      onClose()
    } catch (error) {
      console.error("Error al imprimir boletín:", error)
      alert("Error al generar el PDF. Por favor, intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Imprimir Boletín</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Se generará un PDF con el formato de boletín para el movimiento de ganado mayor (bovinos).</p>
          <p className="mt-2">
            <strong>Boletín No:</strong> {boletinNumber}
          </p>
          <p className="mt-2">
            <strong>Registros:</strong> {data.length}
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="font-semibold">Totales:</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p>Cantidad: {totalCantidad.toLocaleString()}</p>
              <p>Machos: {totalMachos.toLocaleString()}</p>
              <p>Hembras: {totalHembras.toLocaleString()}</p>
              <p>Valor Deguello: ${totalDeguello.toLocaleString()}</p>
              <p>Servicio Matadero: ${totalServicioMatadero.toLocaleString()}</p>
              <p>Fedegan: ${totalFedegan.toLocaleString()}</p>
              <p>Total: ${totalGeneral.toLocaleString()}</p>
            </div>
            <div className="mt-4">
              <p className="font-semibold">Distribución del Impuesto:</p>
              <p>Valor Total del Impuesto Deguello: ${totalDeguello.toLocaleString()}</p>
              <p>Alcaldía 50%: ${(totalDeguello * 0.5).toLocaleString()}</p>
              <p>Gobernación 50%: ${(totalDeguello * 0.5).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePrint} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Imprimir Boletín"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
