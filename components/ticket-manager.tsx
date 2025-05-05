"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCw, RotateCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import PrintTicketDialog from "./print-ticket-dialog"

interface TicketManagerProps {
  locationId: number
  locationName: string
  onTicketGenerated?: (ticket: number) => void
}

export default function TicketManager({ locationId, locationName, onTicketGenerated }: TicketManagerProps) {
  const [currentCount, setCurrentCount] = useState<number | null>(null)
  const [nextTicket, setNextTicket] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { toast } = useToast()

  // Cargar el contador actual al montar el componente
  useEffect(() => {
    loadCurrentCount()
  }, [locationId])

  const loadCurrentCount = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tickets/current/${locationId}`)

      if (!response.ok) {
        throw new Error("Error al cargar el contador de tickets")
      }

      const data = await response.json()
      console.log("Datos recibidos del API:", data)
      setCurrentCount(data.currentCount)
      setNextTicket(data.nextTicket)
    } catch (error) {
      console.error("Error al cargar contador de tickets:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el contador de tickets",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateNextTicket = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch(`/api/tickets/next/${locationId}`)

      if (!response.ok) {
        throw new Error("Error al generar el siguiente ticket")
      }

      const data = await response.json()
      console.log("Ticket generado:", data)
      setCurrentCount(data.ticket)
      setNextTicket(data.ticket + 1)

      if (onTicketGenerated) {
        onTicketGenerated(data.ticket)
      }

      toast({
        title: "Ticket generado",
        description: `Nuevo ticket #${data.ticket} generado para ${locationName}`,
      })
    } catch (error) {
      console.error("Error al generar ticket:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el siguiente ticket",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetCounter = async () => {
    try {
      setIsResetting(true)
      const response = await fetch(`/api/tickets/reset/${locationId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al reiniciar el contador de tickets")
      }

      const data = await response.json()
      console.log("Contador reiniciado:", data)

      // Actualizar directamente los estados en lugar de recargar
      setCurrentCount(0)
      setNextTicket(1)

      toast({
        title: "Contador reiniciado",
        description: `El contador de tickets para ${locationName} ha sido reiniciado. El próximo ticket será #1.`,
      })
    } catch (error) {
      console.error("Error al reiniciar contador:", error)
      toast({
        title: "Error",
        description: "No se pudo reiniciar el contador de tickets",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Gestor de Tickets - {locationName}</CardTitle>
          <CardDescription>
            Genere tickets automáticamente para el mes actual. Los tickets se reinician cada mes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current-count">Último Ticket Registrado</Label>
                <Input
                  id="current-count"
                  value={isLoading ? "Cargando..." : currentCount === null ? "N/A" : currentCount}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="next-ticket">Próximo Ticket</Label>
                <Input
                  id="next-ticket"
                  value={isLoading ? "Cargando..." : nextTicket === null ? "N/A" : nextTicket}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              disabled={isLoading || isResetting || isGenerating}
            >
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
              Reiniciar Contador
            </Button>
            <PrintTicketDialog locationId={locationId} locationName={locationName} currentTicket={currentCount} />
          </div>
          <Button onClick={generateNextTicket} disabled={isLoading || isResetting || isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Generar Ticket
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de reiniciar el contador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reiniciará el contador de tickets para {locationName} a cero. El próximo ticket será #1. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={resetCounter} className="bg-red-600 hover:bg-red-700">
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reiniciar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
