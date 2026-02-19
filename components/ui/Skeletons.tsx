function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[--surface-tertiary] rounded-md ${className || ''}`} />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="hero-gradient rounded-2xl px-8 py-7">
        <Shimmer className="h-6 w-56 bg-white/10 mb-2" />
        <Shimmer className="h-4 w-72 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Shimmer className="h-3 w-16 mb-3" />
            <Shimmer className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <Shimmer className="w-[140px] h-[140px] rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-6 w-40" />
            <Shimmer className="h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card p-6">
          <Shimmer className="h-4 w-28 mb-4" />
          <Shimmer className="h-[120px] w-[120px] rounded-full mx-auto" />
        </div>
        <div className="card p-6">
          <Shimmer className="h-4 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Shimmer className="h-3 w-24 mb-1" />
                <Shimmer className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function BillsListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Shimmer className="h-7 w-32 mb-2" />
        <Shimmer className="h-4 w-48" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Shimmer className="h-10 flex-1 min-w-[200px]" />
        <Shimmer className="h-10 w-36" />
        <Shimmer className="h-10 w-28" />
        <Shimmer className="h-10 w-20" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shimmer className="h-5 w-16" />
              <Shimmer className="h-5 w-20" />
            </div>
            <Shimmer className="h-5 w-3/4 mb-2" />
            <Shimmer className="h-3 w-full mb-3" />
            <div className="flex gap-3">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BillDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <Shimmer className="h-4 w-16 mb-6" />
      <div className="hero-gradient rounded-2xl px-8 py-7 mb-6">
        <div className="flex gap-2 mb-3">
          <Shimmer className="h-6 w-20 bg-white/10" />
          <Shimmer className="h-6 w-24 bg-white/10" />
        </div>
        <Shimmer className="h-8 w-3/4 bg-white/10 mb-2" />
        <Shimmer className="h-4 w-1/2 bg-white/5" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <Shimmer className="h-4 w-24 mb-4" />
            <div className="space-y-2">
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-3/4" />
            </div>
          </div>
          <div className="card p-6">
            <Shimmer className="h-4 w-36 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Shimmer className="h-20 w-full rounded-lg" />
                <Shimmer className="h-20 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Shimmer className="h-20 w-full rounded-lg" />
                <Shimmer className="h-20 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card">
            <Shimmer className="h-12 w-full rounded-none rounded-t-xl" />
            <div className="p-5 space-y-2">
              <Shimmer className="h-12 w-full rounded-lg" />
              <Shimmer className="h-12 w-full rounded-lg" />
              <Shimmer className="h-12 w-full rounded-lg" />
            </div>
          </div>
          <div className="card p-5 space-y-3">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-2 w-full" />
            <Shimmer className="h-2 w-full" />
            <Shimmer className="h-2 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
