'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

const BILL_TYPE_INFO: Record<string, { full: string; description: string }> = {
  HR:       { full: 'House Bill',                  description: 'A proposed law introduced in the House of Representatives. Must pass both chambers and be signed by the President to become law.' },
  S:        { full: 'Senate Bill',                 description: 'A proposed law introduced in the Senate. Must pass both chambers and be signed by the President to become law.' },
  HRES:     { full: 'House Resolution',            description: 'A resolution that only the House votes on — often ceremonial, procedural, or expressing the House\'s opinion. Does not become law.' },
  SRES:     { full: 'Senate Resolution',           description: 'A resolution that only the Senate votes on — often ceremonial, procedural, or expressing the Senate\'s opinion. Does not become law.' },
  HJRES:    { full: 'House Joint Resolution',      description: 'Requires approval from both chambers. Used for constitutional amendments, emergency spending, or declaring war. Has the force of law.' },
  SJRES:    { full: 'Senate Joint Resolution',     description: 'Requires approval from both chambers. Used for constitutional amendments, emergency spending, or declaring war. Has the force of law.' },
  HCONRES:  { full: 'House Concurrent Resolution', description: 'Passed by both chambers but does not require the President\'s signature. Used for procedural matters like setting Congress\'s budget blueprint.' },
  SCONRES:  { full: 'Senate Concurrent Resolution', description: 'Passed by both chambers but does not require the President\'s signature. Used for procedural matters like setting Congress\'s budget blueprint.' },
}

interface Props {
  billType: string
  billNumber: string | number
  className?: string
}

export default function BillTypeBadge({ billType, billNumber, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const info = BILL_TYPE_INFO[billType.toUpperCase()]

  if (!info) {
    return (
      <span className={`badge bg-[--dark] text-white ${className}`}>
        {billType} {billNumber}
      </span>
    )
  }

  return (
    <span className="relative inline-flex items-center">
      <span className={`badge bg-[--dark] text-white flex items-center gap-1 ${className}`}>
        {billType} {billNumber}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label={`What is ${billType}?`}
        >
          <Info className="w-3 h-3" />
        </button>
      </span>

      {open && (
        <>
          {/* backdrop to close */}
          <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-[--surface] border border-[--border] rounded-xl shadow-xl p-3">
            <p className="text-xs font-bold text-[--text] mb-0.5">{info.full}</p>
            <p className="text-[11px] text-[--text-secondary] leading-relaxed">{info.description}</p>
            <p className="text-[10px] text-[--text-muted] mt-2 pt-2 border-t border-[--border]">
              The number <span className="font-semibold text-[--text]">{billNumber}</span> is the sequential order this bill was introduced in Congress.
            </p>
          </div>
        </>
      )}
    </span>
  )
}
