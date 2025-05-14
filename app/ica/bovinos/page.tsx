import { IcaClient } from "../ica-client"

export default function IcaBovinosPage() {
  return (
    <div className="container mx-auto py-6">
      <IcaClient tipoAnimal="bovinos" />
    </div>
  )
}
