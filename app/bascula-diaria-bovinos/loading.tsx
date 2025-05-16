import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4 mt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[300px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Skeleton className="h-[400px] w-full" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
