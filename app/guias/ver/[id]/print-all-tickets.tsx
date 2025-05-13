"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useState } from "react"
import BulkTicketPrinter from "@/components/bulk-ticket-printer"
import { toast } from "@/components/ui/use-toast"

// Tipo para los datos del ticket
interface TicketData {
  ticketNumber: number
  ticket2?: number
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

interface PrintAllTicketsProps {
  guiaId: number
  tickets: TicketData[]
}

export default function PrintAllTickets({ guiaId, tickets }: PrintAllTicketsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [ticketsToShow, setTicketsToShow] = useState<TicketData[]>([])
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const handlePrintTickets = async () => {
    try {
      setIsLoading(true)

      // Obtener los tickets actualizados directamente de la API
      console.log("Obteniendo tickets para la guía:", guiaId)
      const response = await fetch(`/api/tickets/get-by-guia/${guiaId}`)

      if (!response.ok) {
        throw new Error(`Error al obtener tickets: ${response.status}`)
      }

      const data = await response.json()

      if (!data.tickets || data.tickets.length === 0) {
        throw new Error("No se encontraron tickets para esta guía")
      }

      console.log(`Se encontraron ${data.tickets.length} tickets para imprimir`)

      // Mapear los tickets al formato esperado por BulkTicketPrinter
      const ticketsToShow = data.tickets.map((ticket) => {
        // Asegurarnos de que ticket2 sea un número
        const ticket2Value =
          ticket.ticket2 !== undefined && ticket.ticket2 !== null ? Number(ticket.ticket2) : Number(ticket.ticket)

        return {
          ticketNumber: Number(ticket.ticket),
          ticket2: ticket2Value,
          transaction_id: Number(guiaId),
          fecha: new Date(ticket.fecha).toLocaleDateString("es-CO"),
          duenioAnterior: tickets[0]?.duenioAnterior || "N/A",
          cedulaDuenio: tickets[0]?.cedulaDuenio || "N/A",
          tipoAnimal: ticket.product_name || "Animal",
          sku: ticket.product_id?.toString() || "",
          pesoKg: Number(ticket.quantity || 0),
          raza: ticket.raza_nombre || "N/A",
          color: ticket.color_nombre || "N/A",
          genero: ticket.genero_nombre || "N/A",
          valor: Number(ticket.valor || 6000),
        }
      })

      // Mostrar el diálogo de impresión con los tickets actualizados
      setTicketsToShow(ticketsToShow)
      setShowPrintDialog(true)
    } catch (error) {
      console.error("Error al preparar tickets para impresión:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los tickets para impresión",
        variant: "destructive",
      })

      // En caso de error, intentar usar los tickets proporcionados como prop
      if (tickets && tickets.length > 0) {
        console.log("Usando tickets de respaldo:", tickets)
        setTicketsToShow(tickets)
        setShowPrintDialog(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintComplete = () => {
    console.log("Impresión completada")
    setShowPrintDialog(false)
  }

  return (
    <>
      <Button variant="outline" className="flex items-center gap-2" onClick={handlePrintTickets} disabled={isLoading}>
        <Printer className="h-4 w-4" />
        {isLoading ? "Cargando..." : `Imprimir Todos los Tickets (${tickets.length})`}
      </Button>

      <BulkTicketPrinter
        tickets={ticketsToShow}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
        onComplete={handlePrintComplete}
      />
    </>
  )
}
