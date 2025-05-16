import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 flex justify-center items-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-gray-500">Cargando informe...</p>
      </div>
    </div>
  )
}
