"use client"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TicketPrinter from "./ticket-printer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

interface PrintTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketNumber: number
  ticket2: number // Añadir esta propiedad
  value: number
  date: string
  user: string
  identification: string
  animalType: string
  weight: number
  breed: string
  color: string
  gender: string
  codigoAnimal?: number // Para el código del animal (ticket original)
}

export default function PrintTicketDialog({
  open,
  onOpenChange,
  ticketNumber,
  ticket2,
  value,
  date,
  user,
  identification,
  animalType,
  weight,
  breed,
  color,
  gender,
  codigoAnimal,
}: PrintTicketDialogProps) {
  const { toast } = useToast()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Imprimir Ticket</DialogTitle>
          <DialogDescription>Complete la información para imprimir un ticket.</DialogDescription>
        </DialogHeader>
        <div className="print-content">
          <TicketPrinter
            ticketNumber={ticketNumber}
            ticket2={ticket2}
            value={value}
            date={date}
            user={user}
            identification={identification}
            animalType={animalType}
            weight={weight}
            breed={breed}
            color={color}
            gender={gender}
            codigoAnimal={codigoAnimal}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
