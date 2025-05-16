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
              <Skeleton className="h-10 w-full md:w-1/3" />
              <Skeleton className="h-10 w-full md:w-1/3" />
              <Skeleton className="h-10 w-full md:w-1/6" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
