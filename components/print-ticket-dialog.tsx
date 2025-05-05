"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  locationId: number
  locationName: string
  currentTicket: number | null
}

export default function PrintTicketDialog({ locationId, locationName, currentTicket }: PrintTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [ticketData, setTicketData] = useState({
    ticketNumber: currentTicket || 0,
    duenioAnterior: "",
    cedulaDuenio: "",
    tipoAnimal: locationId === 1 ? "BOVINO" : "PORCINO",
    sku: "",
    pesoKg: 0,
    raza: "",
    color: "",
    genero: "MACHO",
  })
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTicketData((prev) => ({
      ...prev,
      [name]: name === "pesoKg" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setTicketData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrintSuccess = () => {
    setOpen(false)
    toast({
      title: "Ticket impreso",
      description: `El ticket #${ticketData.ticketNumber} ha sido enviado a la impresora`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Imprimir Ticket</DialogTitle>
          <DialogDescription>
            Complete la información para imprimir un ticket de {locationName.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ticketNumber" className="text-right">
              Ticket Nº
            </Label>
            <Input
              id="ticketNumber"
              name="ticketNumber"
              type="number"
              value={ticketData.ticketNumber}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duenioAnterior" className="text-right">
              Usuario
            </Label>
            <Input
              id="duenioAnterior"
              name="duenioAnterior"
              value={ticketData.duenioAnterior}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Nombre del dueño anterior"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cedulaDuenio" className="text-right">
              Cédula
            </Label>
            <Input
              id="cedulaDuenio"
              name="cedulaDuenio"
              value={ticketData.cedulaDuenio}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Cédula o NIT"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">
              SKU
            </Label>
            <Input
              id="sku"
              name="sku"
              value={ticketData.sku}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Código del producto"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pesoKg" className="text-right">
              Peso (kg)
            </Label>
            <Input
              id="pesoKg"
              name="pesoKg"
              type="number"
              step="0.01"
              value={ticketData.pesoKg}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="raza" className="text-right">
              Raza
            </Label>
            <Input id="raza" name="raza" value={ticketData.raza} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input id="color" name="color" value={ticketData.color} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="genero" className="text-right">
              Género
            </Label>
            <Select value={ticketData.genero} onValueChange={(value) => handleSelectChange("genero", value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccione género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MACHO">MACHO</SelectItem>
                <SelectItem value="HEMBRA">HEMBRA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </DialogClose>
          <TicketPrinter
            ticketData={{
              ...ticketData,
              fecha: new Date().toLocaleString("es-CO"),
            }}
            onSuccess={handlePrintSuccess}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
