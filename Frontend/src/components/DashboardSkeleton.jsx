import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function DashboardSkeleton() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex-1 max-w-md">
          <Skeleton className="h-10 w-[70%] ml-35" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Society Cards Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="rounded-2xl border border-gray-100">
            <CardHeader className="flex justify-between items-start pb-0">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </CardHeader>

            <CardContent className="space-y-4 pt-3">
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardContent>

            <CardFooter className="pt-3 flex justify-end">
              <Skeleton className="h-9 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function EmptyStateSkeleton() {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
      <Skeleton className="h-6 w-48 mx-auto mb-2" />
      <Skeleton className="h-4 w-64 mx-auto mb-4" />
      <Skeleton className="h-10 w-32 mx-auto" />
    </div>
  );
}
