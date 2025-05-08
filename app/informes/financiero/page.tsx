import { FinancialDashboard } from "@/components/dashboard/financial-dashboard"
import { getFinancialData } from "../actions"

export default async function FinancialDashboardPage() {
  const data = await getFinancialData()

  return (
    <div className="space-y-6">
      <FinancialDashboard data={data} />
    </div>
  )
}
