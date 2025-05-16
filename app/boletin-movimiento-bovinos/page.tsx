import { BoletinBovinosClient } from "./boletin-bovinos-client"

export const metadata = {
  title: "Boletín Movimiento de Bovinos",
  description: "Informe detallado de movimientos de bovinos y valores de impuestos",
}

export default function BoletinMovimientoBovinosPage() {
  return (
    <div className="container mx-auto py-6">
      <BoletinBovinosClient />
    </div>
  )
}
