"use client"

import { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import { useRouter } from "next/navigation"
import { createTax, updateTax, type TaxFormState } from "./actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

// Esquema de validación para el formulario
const formSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  valor: z.coerce.number().min(0, { message: "El valor debe ser mayor o igual a 0" }),
  location_id: z.string().min(1, { message: "La ubicación es requerida" }),
})

type FormValues = z.infer<typeof formSchema>

export default function TaxForm({ tax }: { tax?: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Estado inicial para el formulario
  const initialState: TaxFormState = { errors: {}, message: null }

  // Configurar el estado del formulario con la acción correspondiente
  const [state, formAction] = useFormState(tax ? updateTax.bind(null, tax.id) : createTax, initialState)

  // Configurar el formulario con react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: tax?.nombre || "",
      valor: tax?.valor || 0,
      location_id: tax?.location_id?.toString() || "",
    },
  })

  // Cargar las ubicaciones al montar el componente
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations")
        const data = await response.json()
        setLocations(data)
      } catch (error) {
        console.error("Error al cargar ubicaciones:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las ubicaciones. Intente de nuevo.",
          variant: "destructive",
        })
      }
    }

    fetchLocations()
  }, [toast])

  // Manejar errores del servidor
  useEffect(() => {
    if (state.message) {
      toast({
        title: state.errors ? "Error" : "Éxito",
        description: state.message,
        variant: state.errors ? "destructive" : "default",
      })
    }
  }, [state, toast])

  // Manejar el envío del formulario
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)

    // Crear un FormData para enviar al servidor
    const formData = new FormData()
    formData.append("nombre", data.nombre)
    formData.append("valor", data.valor.toString())
    formData.append("location_id", data.location_id)

    // Llamar a la acción del formulario
    await formAction(formData)

    setIsLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Impuesto</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Impuesto Degüello Bovino" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (COP)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una ubicación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.nombre} ({location.tipo === "bovino" ? "Bovinos" : "Porcinos"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {state.errors?._form && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500">
            {state.errors._form.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : tax ? "Actualizar Impuesto" : "Crear Impuesto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/impuestos")}>
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
