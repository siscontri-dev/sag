"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Eye, Trash } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { deleteContact } from "./actions"
import { useToast } from "@/hooks/use-toast"
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
import { Badge } from "@/components/ui/badge"

export default function ContactsTable({ contacts }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [contactToDelete, setContactToDelete] = useState(null)

  const handleDelete = async () => {
    if (!contactToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteContact(contactToDelete.id)

      if (result.success) {
        toast({
          title: "Contacto eliminado",
          description: "El contacto ha sido eliminado correctamente",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo eliminar el contacto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar contacto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el contacto",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setContactToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">NIT/Cédula</TableHead>
              <TableHead className="font-semibold">Teléfono</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Ubicación</TableHead>
              <TableHead className="text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron contactos.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact, index) => (
                <TableRow key={contact.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="font-medium">
                    {contact.primer_nombre} {contact.primer_apellido}
                  </TableCell>
                  <TableCell>{contact.nit}</TableCell>
                  <TableCell>{contact.telefono || "N/A"}</TableCell>
                  <TableCell>
                    <Badge
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: contact.type === 1 ? "#E6F7FF" : contact.type === 2 ? "#FFF7E6" : "#F6FFED",
                        color: contact.type === 1 ? "#0050B3" : contact.type === 2 ? "#AD6800" : "#389E0D",
                      }}
                    >
                      {contact.type === 1 ? "Dueño Anterior" : contact.type === 2 ? "Dueño Nuevo" : "Ambos"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.location_id || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <Link href={`/contactos/ver/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <Link href={`/contactos/editar/${contact.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setContactToDelete(contact)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
