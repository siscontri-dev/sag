export const dynamic = "force-dynamic"
import { BoletinDiarioDeguelloClient } from "./boletin-diario-deguello-client"

export const metadata = {
  title: "Boletín Diario Deguello G/M",
  description: "Informe detallado de degüellos diarios de ganado mayor y valores de impuestos",
}

export default function BoletinDiarioDeguelloPage() {
  return (
    <div className="container mx-auto py-6">
      <BoletinDiarioDeguelloClient />
    </div>
  )
}
