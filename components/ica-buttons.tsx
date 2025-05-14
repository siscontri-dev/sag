import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface IcaButtonsProps {
  tipo?: "bovinos" | "porcinos" | "ambos"
}

export function IcaButtons({ tipo = "ambos" }: IcaButtonsProps) {
  return (
    <div className="flex gap-2">
      {(tipo === "bovinos" || tipo === "ambos") && (
        <Link href="/ica/bovinos">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Lista ICA Bovinos
          </Button>
        </Link>
      )}
      {(tipo === "porcinos" || tipo === "ambos") && (
        <Link href="/ica/porcinos">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Lista ICA Porcinos
          </Button>
        </Link>
      )}
    </div>
  )
}
