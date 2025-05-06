import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { deleteTax } from "./actions"

export default function TaxesTable({ taxes }: { taxes: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Valor</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {taxes.map((tax) => (
            <tr key={tax.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{tax.nombre}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(tax.valor)}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`/impuestos/editar/${tax.id}`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <form action={deleteTax}>
                    <input type="hidden" name="id" value={tax.id} />
                    <Button variant="outline" size="icon" type="submit" className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
