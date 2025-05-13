"use client"

import { sql } from "@vercel/postgres"
import { notFound } from "next/navigation"
import { formatDate, formatCurrency } from "@/lib/utils"
import { changeGuiaStatus } from "@/app/guias/actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import TicketPrinter from "@/components/ticket-printer"
import PrintAllTickets from "./print-all-tickets"

// Función para obtener los datos de una guía específica
async function getGuia(id: number) {
  try {
    const result = await sql`
      SELECT 
        t.*,
        c1.nombre AS dueno_anterior_nombre,
        c1.identificacion AS dueno_anterior_identificacion,
        c2.nombre AS dueno_nuevo_nombre,
        c2.identificacion AS dueno_nuevo_identificacion,
        l.name AS location_name,
        u.name AS ubicacion_name
      FROM transactions t
      LEFT JOIN contacts c1 ON t.id_dueno_anterior = c1.id
      LEFT JOIN contacts c2 ON t.id_dueno_nuevo = c2.id
      LEFT JOIN business_locations l ON t.business_location_id = l.id
      LEFT JOIN contact_locations u ON t.ubication_contact_id = u.id
      WHERE t.id = ${id} AND t.activo = true
    `

    if (result.rows.length === 0) {
      return null
    }

    // Obtener las líneas de la guía
    const linesResult = await sql`
      SELECT 
        tl.*,
        p.name AS product_name,
        r.nombre AS raza_nombre,
        c.nombre AS color_nombre,
        g.nombre AS genero_nombre
      FROM transaction_lines tl
      LEFT JOIN products p ON tl.product_id = p.id
      LEFT JOIN razas r ON tl.raza_id = r.id
      LEFT JOIN colors c ON tl.color_id = c.id
      LEFT JOIN generos g ON tl.genero_id = g.id
      WHERE tl.transaction_id = ${id} AND tl.activo = true
      ORDER BY tl.id ASC
    `

    return {
      ...result.rows[0],
      lines: linesResult.rows,
    }
  } catch (error) {
    console.error("Error al obtener guía:", error)
    return null
  }
}

export default async function VerGuiaPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const guia = await getGuia(id)

  if (!guia) {
    notFound()
  }

  // Preparar los datos para la impresión de tickets
  const ticketsData = guia.lines.map((line) => ({
    ticketNumber: Number(line.ticket),
    ticket2: line.ticket2 ? Number(line.ticket2) : undefined,
    transaction_id: Number(guia.id),
    fecha: formatDate(guia.fecha_documento),
    duenioAnterior: guia.dueno_anterior_nombre || "N/A",
    cedulaDuenio: guia.dueno_anterior_identificacion || "N/A",
    tipoAnimal: line.product_name || "Animal",
    sku: line.product_id?.toString() || "",
    pesoKg: Number(line.quantity || 0),
    raza: line.raza_nombre || "N/A",
    color: line.color_nombre || "N/A",
    genero: line.genero_nombre || "N/A",
    valor: Number(line.valor || 0),
  }))

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/guias">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Detalles de Guía #{guia.numero_documento}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/guias/editar/${id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <PrintAllTickets guiaId={Number(id)} tickets={ticketsData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Información General</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Número de Documento</p>
              <p className="font-medium">{guia.numero_documento}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium">{formatDate(guia.fecha_documento)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="font-medium">{guia.estado}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium">{guia.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ubicación</p>
              <p className="font-medium">{guia.location_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ubicación Específica</p>
              <p className="font-medium">{guia.ubicacion_name || "No especificada"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium">{formatCurrency(Number.parseFloat(guia.total))}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Información de Contactos</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-gray-500">Dueño Anterior</p>
              <p className="font-medium">
                {guia.dueno_anterior_nombre} ({guia.dueno_anterior_identificacion})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dueño Nuevo</p>
              <p className="font-medium">
                {guia.dueno_nuevo_nombre} ({guia.dueno_nuevo_identificacion})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Líneas de la Guía</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T.Báscula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Género
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guia.lines.map((line, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.ticket}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {line.ticket2 || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{line.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number.parseFloat(line.quantity).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {line.raza_nombre || "No especificada"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {line.color_nombre || "No especificado"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {line.genero_nombre || "No especificado"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(Number.parseFloat(line.valor))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <TicketPrinter
                      ticketData={{
                        ticketNumber: line.ticket,
                        ticket2: line.ticket2,
                        transaction_id: line.transaction_id,
                        fecha: formatDate(guia.fecha_documento),
                        duenioAnterior: guia.dueno_anterior_nombre,
                        cedulaDuenio: guia.dueno_anterior_identificacion,
                        tipoAnimal: line.product_name || "Animal",
                        sku: line.product_id.toString(),
                        pesoKg: Number.parseFloat(line.quantity),
                        raza: line.raza_nombre || "No especificada",
                        color: line.color_nombre || "No especificado",
                        genero: line.genero_nombre || "No especificado",
                        valor: Number.parseFloat(line.valor),
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={async () => {
              await changeGuiaStatus(id, "Anulada")
              window.location.reload()
            }}
          >
            Anular Guía
          </Button>
        </div>
      </div>
    </div>
  )
}
