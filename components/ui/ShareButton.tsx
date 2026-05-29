'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  url: string
  title: string
  text?: string
  className?: string
  label?: string
  variant?: 'icon' | 'pill'
}

export default function ShareButton({ url, title, text, className = '', label = 'Share', variant = 'pill' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareData = { url, title, text: text ?? title }

    // Native share sheet (mobile / supported desktop)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        title={copied ? 'Link copied!' : label}
        className={`p-2 rounded-lg text-[--text-muted] hover:text-[--accent] hover:bg-[--surface-secondary] transition-colors ${className}`}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[--border] text-[--text-secondary] hover:border-[--accent]/40 hover:text-[--accent] transition-colors ${className}`}
    >
      {copied
        ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!</>
        : <><Share2 className="w-3.5 h-3.5" /> {label}</>
      }
    </button>
  )
}
