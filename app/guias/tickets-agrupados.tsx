"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

// Importar los componentes de forma dinámica para evitar problemas de hidratación
const TicketsAgrupadosDia = dynamic(() => import("@/app/tickets-agrupados/tickets-agrupados-dia"), { ssr: false })
const TicketsAgrupadosMes = dynamic(() => import("@/app/tickets-agrupados/tickets-agrupados-mes"), { ssr: false })

export default function TicketsAgrupados({ tickets = [] }) {
  const [isLoading, setIsLoading] = useState(true)
  const [validTickets, setValidTickets] = useState([])

  useEffect(() => {
    // Asegurarse de que tickets sea un array válido
    if (tickets && Array.isArray(tickets)) {
      setValidTickets(tickets)
    } else {
      console.error("Los tickets no son un array válido:", tickets)
      setValidTickets([])
    }
    setIsLoading(false)
  }, [tickets])

  if (isLoading) {
    return <div className="py-10 text-center">Cargando datos de tickets...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dia" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dia">Agrupar por Día</TabsTrigger>
          <TabsTrigger value="mes">Agrupar por Mes</TabsTrigger>
        </TabsList>

        <TabsContent value="dia">
          <TicketsAgrupadosDia tickets={validTickets} />
        </TabsContent>

        <TabsContent value="mes">
          <TicketsAgrupadosMes tickets={validTickets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
