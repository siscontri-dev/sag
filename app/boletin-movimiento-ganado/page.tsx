import { BoletinClient } from "./boletin-client"

export const metadata = {
  title: "Boletín Movimiento de Ganado",
  description: "Informe detallado de movimientos de ganado y valores de impuestos",
}

export default function BoletinMovimientoGanadoPage() {
  return (
    <div className="container mx-auto py-6">
      <BoletinClient />
    </div>
  )
}
