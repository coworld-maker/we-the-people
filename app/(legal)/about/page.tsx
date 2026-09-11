import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About', // the root layout's template appends "| Democracy Unlocked"
  description: 'Who built Democracy Unlocked, and why.',
}

/**
 * Everything on this page is the founder's own words. Don't paraphrase or add
 * claims here; edit FOUNDER with text they supplied.
 */
const FOUNDER = {
  name: 'Coleman Dumas IV',
  role: 'Founder',
  // Square headshot in /public. Null hides the photo.
  photo: '/founder.jpg' as string | null,
  // DRAFT — awaiting the founder's edits before merge.
  bio: [
    "I'm Coleman Dumas IV, and I built Democracy Unlocked because the votes that shape our lives are public, yet finding them, and making sense of them, takes more time than most people have.",
    'Every vote here comes from the official congressional record. Enter your ZIP, see what your representatives did, and decide for yourself whether they voted the way you would.',
  ] as string[],
}

export default function AboutPage() {
  return (
    <article>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--gold-text] mb-4">
        About
      </p>
      <h1 className="font-serif font-normal text-4xl sm:text-5xl leading-[1.1] tracking-tight text-[--accent] text-balance">
        Meet the founder
      </h1>

      <div className="mt-10 flex flex-col sm:flex-row gap-8 sm:items-start">
        {FOUNDER.photo && (
          <Image
            src={FOUNDER.photo}
            alt={`${FOUNDER.name}, founder of Democracy Unlocked`}
            width={160}
            height={160}
            priority
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shrink-0 ring-1 ring-[--border]"
          />
        )}
        <div className="min-w-0">
          {FOUNDER.name && <h2 className="font-serif text-2xl text-[--text]">{FOUNDER.name}</h2>}
          <p className="text-sm font-medium text-[--text-muted] mt-1">{FOUNDER.role}</p>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-[--text-secondary] max-w-2xl">
            {FOUNDER.bio.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-[--border]">
        <Link
          href="/"
          className="inline-flex items-center min-h-[48px] px-6 rounded-[--radius] bg-[--accent] text-white font-semibold hover:bg-[--accent-hover] transition-colors"
        >
          Find my reps <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
