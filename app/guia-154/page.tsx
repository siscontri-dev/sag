"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

// Tipo para la guía
type Guia = {
  id: number
  business_location_id: number
  type: string
  status: string
  payment_status: string
  id_dueno_anterior: number
  id_dueno_nuevo: number
  activo: boolean
  created_at: string
  updated_at: string
  dueno_anterior_nombre?: string
  dueno_anterior_nit?: string
  dueno_nuevo_nombre?: string
  dueno_nuevo_nit?: string
  [key: string]: any
}

// Componente para editar la guía
export default function Guia154Page() {
  const [guia, setGuia] = useState<Guia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<any>({})

  // Cargar la guía directamente
  useEffect(() => {
    async function cargarGuia() {
      try {
        setLoading(true)

        // Usar fetch con cache: 'no-store' para evitar problemas de caché
        const response = await fetch("/api/guia-154-directo", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Error al cargar la guía: ${response.status}`)
        }

        const data = await response.json()

        if (!data || !data.id) {
          throw new Error("La guía no tiene un formato válido")
        }

        setGuia(data)
        setFormData(data)
      } catch (err) {
        console.error("Error al cargar la guía:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    cargarGuia()
  }, [])

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      const response = await fetch("/api/guia-154-actualizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Error al guardar: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert("Guía actualizada correctamente")
        // Recargar la guía
        window.location.reload()
      } else {
        throw new Error(result.error || "Error al guardar la guía")
      }
    } catch (err) {
      console.error("Error al guardar:", err)
      alert(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Cargando Guía #154</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Cargando información de la guía...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error al cargar la guía #154</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <div className="flex gap-4">
                <Button onClick={() => window.location.reload()}>Intentar nuevamente</Button>
                <Button variant="outline" asChild>
                  <Link href="/guias">Volver a Guías</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Editar Guía #154 (Modo Directo)</CardTitle>
        </CardHeader>
        <CardContent>
          {guia ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">ID</label>
                  <input
                    type="text"
                    value={formData.id || ""}
                    disabled
                    className="w-full p-2 border rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    name="type"
                    value={formData.type || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="entry">Entrada</option>
                    <option value="sell">Venta</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    name="status"
                    value={formData.status || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="draft">Borrador</option>
                    <option value="final">Final</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estado de Pago</label>
                  <select
                    name="payment_status"
                    value={formData.payment_status || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="paid">Pagado</option>
                    <option value="due">Pendiente</option>
                    <option value="partial">Parcial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dueño Anterior</label>
                  <input
                    type="text"
                    value={formData.dueno_anterior_nombre || ""}
                    disabled
                    className="w-full p-2 border rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dueño Nuevo</label>
                  <input
                    type="text"
                    value={formData.dueno_nuevo_nombre || ""}
                    disabled
                    className="w-full p-2 border rounded-md bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Activo</label>
                  <select
                    name="activo"
                    value={formData.activo ? "true" : "false"}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de Creación</label>
                  <input
                    type="text"
                    value={new Date(formData.created_at).toLocaleString() || ""}
                    disabled
                    className="w-full p-2 border rounded-md bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" asChild>
                  <Link href="/guias">Volver a Guías</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <p>No se pudo cargar la información de la guía.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
