import { BasculaIntegradaClient } from "./bascula-integrada-client"

export const metadata = {
  title: "Báscula Diaria Integrada - Bovinos y Porcinos",
  description: "Informe integrado de báscula diaria para bovinos y porcinos",
}

export default function BasculaDiariaIntegradaPage() {
  return (
    <div className="container mx-auto py-6">
      <BasculaIntegradaClient />
    </div>
  )
}
