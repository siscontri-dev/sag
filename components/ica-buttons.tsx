import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export function IcaButtons() {
  return (
    <div className="flex gap-2">
      <Link href="/ica/bovinos">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Lista ICA Bovinos
        </Button>
      </Link>
      <Link href="/ica/porcinos">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Lista ICA Porcinos
        </Button>
      </Link>
    </div>
  )
}
