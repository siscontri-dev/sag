import { FinancialDashboard } from "@/components/dashboard/financial-dashboard"
import { getFinancialData } from "../actions"

export default async function FinancialDashboardPage() {
  const data = await getFinancialData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
      </div>

      <FinancialDashboard data={data} />
    </div>
  )
}
