"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useState } from "react"
import PrintGuiaDeguello from "./print-guia-deguello"
import { useToast } from "@/hooks/use-toast"

interface PrintGuiaDeguelloButtonProps {
  guiaId: number
  className?: string
}

export default function PrintGuiaDeguelloButton({ guiaId, className }: PrintGuiaDeguelloButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [guiaData, setGuiaData] = useState<any>(null)
  const { toast } = useToast()

  const handleClick = async () => {
    setLoading(true)
    try {
      // Obtener los datos de la guía
      const response = await fetch(`/api/guias/${guiaId}`)
      if (!response.ok) {
        throw new Error("Error al obtener los datos de la guía")
      }

      const data = await response.json()

      // Transformar los datos al formato esperado por el componente de impresión
      const guiaFormateada = {
        id: data.id,
        fecha: data.fecha_documento,
        numero_documento: data.numero_documento,
        dueno_anterior: {
          nombre: data.dueno_anterior_nombre || "N/A",
          nit: data.dueno_anterior_nit || "N/A",
          direccion: data.ubicacion_anterior_direccion || "N/A",
        },
        dueno_nuevo: data.id_dueno_nuevo
          ? {
              nombre: data.dueno_nuevo_nombre || "N/A",
              nit: data.dueno_nuevo_nit || "N/A",
              direccion: data.ubicacion_nueva_direccion || "N/A",
            }
          : undefined,
        cantidad: data.quantity_m + data.quantity_h,
        tipo_animal: data.business_location_id === 1 ? "porcino" : "bovino",
        machos: data.quantity_m,
        hembras: data.quantity_h,
        peso_total: data.quantity_k,
        colores: "Varios", // Esto debería venir de los datos
        marca: data.marca || "N/A",
        senales_particulares: "",
        impuesto_deguello: data.impuesto_deguello || data.total * 0.57, // Estimado si no existe
        impuesto_porcicultura: data.impuesto_porcicultura || data.total * 0.43, // Estimado si no existe
        total: data.total,
        recibo_bascula: data.recibo_bascula || "",
      }

      setGuiaData(guiaFormateada)
      setOpen(true)
    } catch (error) {
      console.error("Error al preparar la impresión:", error)
      toast({
        title: "Error",
        description: "No se pudo preparar la guía para impresión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} className={className}>
        <Printer className="h-4 w-4 mr-2" />
        Imprimir Guía Degüello
      </Button>

      {guiaData && (
        <PrintGuiaDeguello
          guia={guiaData}
          open={open}
          onOpenChange={setOpen}
          onComplete={() => {
            // Acciones después de completar la impresión
          }}
        />
      )}
    </>
  )
}
