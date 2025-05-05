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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIT/Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
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
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    {contact.primer_nombre} {contact.primer_apellido}
                  </TableCell>
                  <TableCell>{contact.nit}</TableCell>
                  <TableCell>{contact.telefono || "N/A"}</TableCell>
                  <TableCell>
                    {contact.type === 1 ? "Dueño Anterior" : contact.type === 2 ? "Dueño Nuevo" : "Ambos"}
                  </TableCell>
                  <TableCell>{contact.location_id || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/contactos/ver/${contact.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/contactos/editar/${contact.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setContactToDelete(contact)}>
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
