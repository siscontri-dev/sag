import { FinancialDashboard } from "@/components/dashboard/financial-dashboard"
import { getFinancialData } from "@/lib/data"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

export default async function FinancialDashboardPage() {
  noStore()
  const data = await getFinancialData()

  return (
    <div className="space-y-6">
      <FinancialDashboard data={data} />
    </div>
  )
}
