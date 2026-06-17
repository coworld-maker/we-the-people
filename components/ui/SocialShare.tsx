'use client'

/**
 * Outbound social share — prefilled post intents only (the user lands on the
 * platform's composer and taps post themselves). No OAuth, no auto-posting,
 * no tokens stored. This is the growth loop the AI-summary clones can't run:
 * they have no vote and no community to share.
 */

import { useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { track } from '@/lib/track'

interface Props {
  url: string
  text: string
  /** analytics context, e.g. 'vote' | 'bill' */
  context?: string
  className?: string
}

// Brand glyphs as inline SVG so we don't pull an icon set for these
function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function BlueskyGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
    </svg>
  )
}
function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
function ThreadsGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.32.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Z" />
    </svg>
  )
}

const PLATFORMS = [
  {
    key: 'x',
    label: 'X',
    Glyph: XGlyph,
    href: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
    cls: 'bg-black text-white hover:bg-black/85',
  },
  {
    key: 'bluesky',
    label: 'Bluesky',
    Glyph: BlueskyGlyph,
    href: (u: string, t: string) =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${t} ${u}`)}`,
    cls: 'bg-[#1185FE] text-white hover:bg-[#0a6fd6]',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    Glyph: FacebookGlyph,
    href: (u: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
    cls: 'bg-[#1877F2] text-white hover:bg-[#1463cc]',
  },
  {
    key: 'threads',
    label: 'Threads',
    Glyph: ThreadsGlyph,
    href: (u: string, t: string) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${t} ${u}`)}`,
    cls: 'bg-black text-white hover:bg-black/85',
  },
] as const

export default function SocialShare({ url, text, context = 'bill', className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  function openShare(key: string, href: string) {
    track('social_share', { platform: key, context })
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=540')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      track('social_share', { platform: 'copy', context })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            onClick={() => openShare(p.key, p.href(url, text))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${p.cls}`}
            aria-label={`Share on ${p.label}`}
          >
            <p.Glyph /> {p.label}
          </button>
        ))}
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[--border] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--accent] transition-colors"
          aria-label="Copy link"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
