import { sql } from "@vercel/postgres"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import PrintGuiaDeguelloButton from "@/components/print-guia-deguello-button"
import PrintAllTickets from "./print-all-tickets"

export default async function VerGuiaPage({ params }: { params: { id: string } }) {
  const id = params.id

  // Obtener los datos de la guía
  const result = await sql`
    SELECT 
      t.*,
      ca.primer_nombre || ' ' || ca.primer_apellido AS dueno_anterior_nombre,
      ca.nit AS dueno_anterior_nit,
      cn.primer_nombre || ' ' || cn.primer_apellido AS dueno_nuevo_nombre,
      cn.nit AS dueno_nuevo_nit,
      ua.nombre_finca AS ubicacion_anterior_nombre,
      un.nombre_finca AS ubicacion_nueva_nombre,
      bl.name AS location_name
    FROM 
      transactions t
    LEFT JOIN 
      contacts ca ON t.id_dueno_anterior = ca.id
    LEFT JOIN 
      contacts cn ON t.id_dueno_nuevo = cn.id
    LEFT JOIN 
      ubication_contact ua ON t.ubication_contact_id = ua.id
    LEFT JOIN 
      ubication_contact un ON t.ubication_contact_id2 = un.id
    LEFT JOIN
      business_locations bl ON t.business_location_id = bl.id
    WHERE 
      t.id = ${id}
      AND t.activo = TRUE
  `

  if (result.rows.length === 0) {
    notFound()
  }

  const guia = result.rows[0]

  // Obtener las líneas de la transacción
  const linesResult = await sql`
    SELECT 
      tl.*,
      p.name AS product_name,
      r.name AS raza_nombre,
      c.name AS color_nombre,
      g.name AS genero_nombre
    FROM 
      transaction_lines tl
    LEFT JOIN 
      products p ON tl.product_id = p.id
    LEFT JOIN 
      razas r ON tl.raza_id = r.id
    LEFT JOIN 
      colores c ON tl.color_id = c.id
    LEFT JOIN 
      generos g ON tl.genero_id = g.id
    WHERE 
      tl.transaction_id = ${id}
  `

  const lineas = linesResult.rows

  // Determinar el tipo de animal basado en business_location_id
  const tipoAnimal = guia.business_location_id === 1 ? "porcino" : "bovino"

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
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
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>

          {/* Botón para imprimir tickets */}
          <PrintAllTickets guiaId={Number(id)} />

          {/* Nuevo botón para imprimir guía de degüello */}
          <PrintGuiaDeguelloButton guiaId={Number(id)} />
        </div>
      </div>

      {/* Resto del contenido de la página... */}

      {/* Información general */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Número de Documento</p>
              <p>{guia.numero_documento}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p>{formatDate(guia.fecha_documento)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estado</p>
              <p className="capitalize">{guia.estado}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo</p>
              <p className="capitalize">{tipoAnimal}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ubicación</p>
              <p>{guia.location_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="font-semibold">{formatCurrency(guia.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del propietario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Propietario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Dueño Anterior</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre</p>
                  <p>{guia.dueno_anterior_nombre || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">NIT/Cédula</p>
                  <p>{guia.dueno_anterior_nit || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Finca</p>
                  <p>{guia.ubicacion_anterior_nombre || "N/A"}</p>
                </div>
              </div>
            </div>

            {guia.id_dueno_nuevo && (
              <div>
                <h3 className="font-medium mb-2">Dueño Nuevo</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p>{guia.dueno_nuevo_nombre || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">NIT/Cédula</p>
                    <p>{guia.dueno_nuevo_nit || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Finca</p>
                    <p>{guia.ubicacion_nueva_nombre || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalle de animales */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Animales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left">Código</th>
                  <th className="border p-2 text-left">T.Báscula</th>
                  <th className="border p-2 text-left">Animal</th>
                  <th className="border p-2 text-left">Kilos</th>
                  <th className="border p-2 text-left">Raza</th>
                  <th className="border p-2 text-left">Color</th>
                  <th className="border p-2 text-left">Género</th>
                  <th className="border p-2 text-left">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, index) => (
                  <tr key={linea.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border p-2">{linea.ticket}</td>
                    <td className="border p-2">{linea.ticket2}</td>
                    <td className="border p-2">{linea.product_name}</td>
                    <td className="border p-2">{linea.quantity}</td>
                    <td className="border p-2">{linea.raza_nombre || "N/A"}</td>
                    <td className="border p-2">{linea.color_nombre || "N/A"}</td>
                    <td className="border p-2">{linea.genero_nombre || "N/A"}</td>
                    <td className="border p-2">{formatCurrency(linea.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td colSpan={3} className="border p-2 text-right">
                    Totales:
                  </td>
                  <td className="border p-2">{guia.quantity_k}</td>
                  <td colSpan={3} className="border p-2 text-right">
                    Total Valor:
                  </td>
                  <td className="border p-2">{formatCurrency(guia.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Total Animales</p>
              <p className="text-xl font-bold text-blue-800">{guia.quantity_m + guia.quantity_h}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-green-800">Machos</p>
              <p className="text-xl font-bold text-green-800">{guia.quantity_m}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-pink-800">Hembras</p>
              <p className="text-xl font-bold text-pink-800">{guia.quantity_h}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
