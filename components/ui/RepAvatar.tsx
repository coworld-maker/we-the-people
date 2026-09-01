'use client'

import { useState } from 'react'

/**
 * Official congressional portrait, with a graceful fall back to initials.
 *
 * Photos come from unitedstates/images (public domain, same trusted host as
 * our legislator data). They are imagery that IS the record — unlike stock
 * civic photography, a member's official portrait next to their voting record
 * strengthens credibility rather than costing it.
 *
 * Plain <img> rather than next/image on purpose: these are already small
 * (225x275) CDN-hosted files, so routing them through Vercel's image
 * optimizer would add billed transformations and a remotePatterns config for
 * no real gain.
 */

const SIZES = {
  sm: { box: 'w-7 h-7', text: 'text-[10px]', px: 28 },
  md: { box: 'w-10 h-10', text: 'text-xs', px: 40 },
  lg: { box: 'w-14 h-14', text: 'text-base', px: 56 },
  xl: { box: 'w-20 h-20', text: 'text-xl', px: 80 },
} as const

function partyRing(party?: string | null): string {
  const p = (party || '').charAt(0).toUpperCase()
  if (p === 'R') return 'ring-[--republican]'
  if (p === 'D') return 'ring-[--democrat]'
  return 'ring-[--independent]'
}

function initialsOf(name: string): string {
  // "Warnock, Raphael G." and "Raphael G. Warnock" both need to work.
  const base = name.includes(',') ? name.split(',')[0] : name
  const parts = base.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase() || '?'
}

interface Props {
  bioguideId?: string | null
  fullName: string
  party?: string | null
  size?: keyof typeof SIZES
  className?: string
}

export default function RepAvatar({
  bioguideId, fullName, party, size = 'md', className = '',
}: Props) {
  const [failed, setFailed] = useState(false)
  const s = SIZES[size]
  const shell = `${s.box} rounded-full shrink-0 ring-2 ${partyRing(party)} ${className}`

  // No id, or the portrait 404'd (newly seated members aren't in the set yet).
  if (!bioguideId || failed) {
    return (
      <div
        className={`${shell} bg-[--surface-tertiary] text-[--text-secondary] font-bold ${s.text} flex items-center justify-center`}
        aria-hidden="true"
      >
        {initialsOf(fullName)}
      </div>
    )
  }

  return (
    <img
      src={`https://unitedstates.github.io/images/congress/225x275/${bioguideId}.jpg`}
      alt={`Official portrait of ${fullName}`}
      width={s.px}
      height={s.px}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${shell} object-cover bg-[--surface-tertiary]`}
    />
  )
}
