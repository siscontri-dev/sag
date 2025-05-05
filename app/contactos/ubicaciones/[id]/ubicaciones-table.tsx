"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash } from "lucide-react"
import { useState } from "react"
import { deleteUbication } from "../../actions"
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

export default function UbicacionesTable({ ubicaciones = [], contactId }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [ubicacionToDelete, setUbicacionToDelete] = useState(null)

  const handleDelete = async () => {
    if (!ubicacionToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteUbication(ubicacionToDelete.id, contactId)

      if (result.success) {
        toast({
          title: "Ubicación eliminada",
          description: "La ubicación ha sido eliminada correctamente",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo eliminar la ubicación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar ubicación:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la ubicación",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setUbicacionToDelete(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre de la Finca</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Área (Ha)</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ubicaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron ubicaciones.
                </TableCell>
              </TableRow>
            ) : (
              ubicaciones.map((ubicacion) => (
                <TableRow key={ubicacion.id}>
                  <TableCell className="font-medium">
                    {ubicacion.nombre_finca}
                    {ubicacion.es_principal && (
                      <Badge variant="outline" className="ml-2">
                        Principal
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{ubicacion.direccion}</div>
                    <div className="text-xs text-muted-foreground">
                      {ubicacion.municipio_nombre}, {ubicacion.departamento_nombre}
                    </div>
                  </TableCell>
                  <TableCell>{ubicacion.area_hectareas || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={ubicacion.activo ? "default" : "destructive"}>
                      {ubicacion.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setUbicacionToDelete(ubicacion)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!ubicacionToDelete} onOpenChange={(open) => !open && setUbicacionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La ubicación será eliminada permanentemente.
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
