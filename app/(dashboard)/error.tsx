'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[--danger]" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[--text] mb-2">Something went wrong</h1>
        <p className="text-[--text-secondary] mb-6">
          An unexpected error occurred. This has been logged and we&apos;ll look into it.
        </p>
        <button onClick={reset} className="btn-primary">
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    </div>
  )
}
