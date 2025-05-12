"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Propietario {
  id: number
  primer_nombre: string
  primer_apellido: string
  nit: string
  type: number
}

interface PropietarioBuscadorProps {
  propietarios: Propietario[]
  valorInicial?: string
}

export default function PropietarioBuscador({ propietarios, valorInicial = "" }: PropietarioBuscadorProps) {
  const [busqueda, setBusqueda] = useState(valorInicial)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [propietariosFiltrados, setPropietariosFiltrados] = useState<Propietario[]>([])
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1)
  const buscadorRef = useRef<HTMLDivElement>(null)

  // Filtrar propietarios cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === "") {
      setPropietariosFiltrados([])
      return
    }

    const terminoBusqueda = busqueda.toLowerCase()
    const filtrados = propietarios.filter(
      (propietario) =>
        (propietario.primer_nombre && propietario.primer_nombre.toLowerCase().includes(terminoBusqueda)) ||
        (propietario.primer_apellido && propietario.primer_apellido.toLowerCase().includes(terminoBusqueda)) ||
        (propietario.nit && propietario.nit.toLowerCase().includes(terminoBusqueda)),
    )
    setPropietariosFiltrados(filtrados)
  }, [busqueda, propietarios])

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Formatear el nombre del propietario
  const formatearNombrePropietario = (propietario: Propietario) => {
    return `${propietario.primer_nombre || ""} ${propietario.primer_apellido || ""} - ${propietario.nit || ""}`
  }

  return (
    <div className="relative" ref={buscadorRef}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="propietario"
          name="propietario"
          type="text"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setMostrarDropdown(true)
            setIndiceSeleccionado(-1)
          }}
          onFocus={() => setMostrarDropdown(true)}
          onKeyDown={(e) => {
            if (!mostrarDropdown || propietariosFiltrados.length === 0) return

            // Navegar con flechas
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setIndiceSeleccionado((prevIndex) =>
                prevIndex < propietariosFiltrados.length - 1 ? prevIndex + 1 : prevIndex,
              )
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setIndiceSeleccionado((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0))
            } else if (e.key === "Enter" && indiceSeleccionado >= 0) {
              e.preventDefault()
              const propietario = propietariosFiltrados[indiceSeleccionado]
              setBusqueda(formatearNombrePropietario(propietario))
              // Establecer el valor oculto para el ID del propietario
              const hiddenInput = document.getElementById("propietario_id") as HTMLInputElement
              if (hiddenInput) {
                hiddenInput.value = propietario.id.toString()
              }
              setMostrarDropdown(false)
            } else if (e.key === "Escape") {
              setMostrarDropdown(false)
            }
          }}
          className="h-8 pl-8"
          placeholder="Buscar propietario por nombre o NIT"
          autoComplete="off"
        />
        {busqueda && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={() => {
              setBusqueda("")
              // Limpiar el valor oculto
              const hiddenInput = document.getElementById("propietario_id") as HTMLInputElement
              if (hiddenInput) {
                hiddenInput.value = ""
              }
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Campo oculto para enviar el ID del propietario seleccionado */}
      <input type="hidden" id="propietario_id" name="propietario_id" />

      {mostrarDropdown && busqueda && propietariosFiltrados.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {propietariosFiltrados.map((propietario, index) => (
            <div
              key={propietario.id}
              className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                index === indiceSeleccionado ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                setBusqueda(formatearNombrePropietario(propietario))
                // Establecer el valor oculto para el ID del propietario
                const hiddenInput = document.getElementById("propietario_id") as HTMLInputElement
                if (hiddenInput) {
                  hiddenInput.value = propietario.id.toString()
                }
                setMostrarDropdown(false)
              }}
            >
              <div className="flex justify-between">
                <span>
                  {propietario.primer_nombre} {propietario.primer_apellido}
                </span>
                <span className="text-gray-500">{propietario.nit}</span>
              </div>
              <div className="text-xs text-gray-500">
                {propietario.type === 1 ? "Persona" : propietario.type === 3 ? "Empresa" : "Otro"}
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarDropdown && busqueda && propietariosFiltrados.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 p-3 text-gray-500">
          No se encontraron propietarios
        </div>
      )}
    </div>
  )
}
