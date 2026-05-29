import { Database, Bot, Scale } from 'lucide-react'
import Link from 'next/link'

interface Props {
  lastSyncedAt?: string | null
}

export default function TrustBar({ lastSyncedAt }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 rounded-xl bg-[--surface] border border-[--border] text-[11px] text-[--text-muted] mb-4">
      {/* Source */}
      <span className="flex items-center gap-1.5">
        <Database className="w-3 h-3 shrink-0 text-[--accent]" />
        <span>
          Bill data from{' '}
          <a
            href="https://api.congress.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[--accent] hover:underline"
          >
            Congress.gov API
          </a>
          {lastSyncedAt ? ` · synced ${new Date(lastSyncedAt).toLocaleDateString()}` : ''}
        </span>
      </span>

      {/* AI disclaimer */}
      <span className="flex items-center gap-1.5">
        <Bot className="w-3 h-3 shrink-0 text-amber-500" />
        <span>
          AI-generated summary{' '}
          <span className="text-amber-700 font-medium">· verify before acting</span>
        </span>
      </span>

      {/* Nonpartisan */}
      <span className="flex items-center gap-1.5 ml-auto">
        <Scale className="w-3 h-3 shrink-0 text-[--text-muted]" />
        <span className="font-medium">Nonpartisan platform</span>
      </span>
    </div>
  )
}
