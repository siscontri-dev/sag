import type { Metadata } from "next"
import TaxForm from "../tax-form"

export const metadata: Metadata = {
  title: "Nuevo Impuesto",
}

export default function NuevoImpuestoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Crear Nuevo Impuesto</h1>
      <div className="rounded-lg border p-6 shadow-sm">
        <TaxForm />
      </div>
    </div>
  )
}
