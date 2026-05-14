import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { CIVIC_GUIDES, GUIDE_ORDER, getGuide } from '@/lib/data/civic-guides'

export async function generateStaticParams() {
  return GUIDE_ORDER.map(slug => ({ slug }))
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const Icon = guide.icon
  const currentIdx = GUIDE_ORDER.indexOf(slug)
  const nextSlug = currentIdx < GUIDE_ORDER.length - 1 ? GUIDE_ORDER[currentIdx + 1] : null
  const prevSlug = currentIdx > 0 ? GUIDE_ORDER[currentIdx - 1] : null
  const nextGuide = nextSlug ? getGuide(nextSlug) : null

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> All guides
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 ${guide.bg} rounded-lg flex items-center justify-center border ${guide.border}`}>
            <Icon className={`w-4 h-4 ${guide.color}`} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider">{guide.category}</span>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-[--text-muted]" />
              <span className="text-xs text-[--text-muted]">{guide.readTime} read</span>
            </div>
          </div>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[--text]">{guide.title}</h1>
      </div>

      {/* Content */}
      <div className="space-y-6 mb-10">
        {guide.content.map((section, i) => (
          <div key={i} className={i === 0 ? '' : 'pt-6 border-t border-[--border]'}>
            <h2 className="font-display text-lg font-bold text-[--text] mb-2">{section.heading}</h2>
            <p className="text-[15px] text-[--text-secondary] leading-relaxed">{section.text}</p>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-[--border]">
        {prevSlug ? (
          <Link href={`/learn/${prevSlug}`} className="btn-secondary text-xs">
            <ArrowLeft className="w-3 h-3" /> Previous
          </Link>
        ) : <div />}
        {nextSlug ? (
          <Link href={`/learn/${nextSlug}`} className="btn-primary text-xs">
            {nextGuide?.title ?? 'Next guide'} <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <Link href="/bills" className="btn-primary text-xs">
            Start voting <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  )
}
