import { BoletinPorcinosClient } from "./boletin-porcinos-client"

export const metadata = {
  title: "Boletín Movimiento de Porcinos",
  description: "Informe detallado de movimientos de porcinos y valores de impuestos",
}

export default function BoletinMovimientoPorcinosPage() {
  return (
    <div className="container mx-auto py-6">
      <BoletinPorcinosClient />
    </div>
  )
}
