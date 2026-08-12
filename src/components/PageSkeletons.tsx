import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border bg-card p-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="mt-4 h-4 w-3/4 rounded-full" />
          <Skeleton className="mt-2 h-3 w-1/2 rounded-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-6">
          <FeedSkeleton />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-40 w-full rounded-3xl md:h-56" />
        <div className="mt-5 flex items-center gap-4">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-2/3 rounded-full" />
            <Skeleton className="mt-2 h-3 w-1/3 rounded-full" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-11/12 rounded-full" />
          <Skeleton className="h-3 w-3/5 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-28 w-full rounded-3xl" />
      </div>
    </div>
  );
}
