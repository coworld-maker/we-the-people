import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Users, ArrowRight } from 'lucide-react'
import MapAndCompare from '@/components/representatives/MapAndCompare'
import SectionNav from '@/components/ui/SectionNav'
import Link from 'next/link'

export const metadata = {
  title: 'My Representatives | Democracy Unlocked',
  description: 'Compare your votes to how your representatives voted in Congress.',
}

const SECTIONS = [
  { id: 'map',          label: 'Find My State' },
  { id: 'how-it-works', label: 'How It Works' },
]

export default async function MyRepresentativesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="hero-gradient rounded-2xl px-5 py-8 sm:px-8 sm:py-10 mb-8">
        <div className="max-w-2xl">
          <div className="badge bg-white/10 text-white/60 border border-white/10 mb-4">
            Your votes vs. their votes
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
            My Representatives
          </h1>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed">
            Tap your state to see how your positions on legislation align with your
            senators and representatives' actual recorded votes in Congress.
          </p>
        </div>
      </div>

      <SectionNav sections={SECTIONS} />

      {/* Interactive map + comparison results */}
      <MapAndCompare />

      {/* How it works */}
      <section id="how-it-works" className="card p-6 mt-8 scroll-mt-20">
        <h2 className="font-display text-sm font-bold text-[--text] mb-5">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Tap your state', desc: 'We look up your current senators and representatives from our database.' },
            { step: '02', title: 'We find overlapping bills', desc: 'Any bill you voted on that also had a recorded congressional roll call vote.' },
            { step: '03', title: 'See your alignment', desc: 'Compare your Yes/No to their Yea/Nay and get a percentage alignment score.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[--accent] text-white font-display text-xs font-bold rounded-full mb-3">
                {item.step}
              </span>
              <h3 className="font-display text-sm font-bold text-[--text] mb-1">{item.title}</h3>
              <p className="text-xs text-[--text-secondary] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-[--border] flex items-center justify-between text-xs text-[--text-muted]">
          <span>Need more votes in common? Vote on more bills to improve your score.</span>
          <Link href="/bills" className="flex items-center gap-1 font-semibold text-[--accent] hover:text-[--accent-hover] transition-colors">
            Browse bills <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
