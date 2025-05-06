import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTaxById } from "@/lib/data"
import TaxForm from "../../tax-form"

export const metadata: Metadata = {
  title: "Editar Impuesto",
}

export default async function EditarImpuestoPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id
  const tax = await getTaxById(id)

  if (!tax) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Editar Impuesto</h1>
      <div className="rounded-lg border p-6 shadow-sm">
        <TaxForm tax={tax} />
      </div>
    </div>
  )
}
