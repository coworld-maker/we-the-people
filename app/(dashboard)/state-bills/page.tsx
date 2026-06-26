import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Landmark, MapPin } from 'lucide-react'
import StateBillsBrowser from '@/components/state-bills/StateBillsBrowser'

export const metadata = {
  title: 'State Legislature | Democracy Unlocked',
  description: 'Browse recent state legislature bills from all 50 states, powered by OpenStates.',
}

export default async function StateBillsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Landmark className="w-5 h-5 text-[--accent]" />
          <h1 className="font-display text-2xl font-extrabold text-[--text]">State Legislature</h1>
        </div>
        <p className="text-sm text-[--text-secondary]">
          Browse recent bills from all 50 state legislatures, powered by{' '}
          <a
            href="https://openstates.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[--accent] hover:underline font-medium"
          >
            OpenStates
          </a>
          . Many everyday issues — housing, education, public safety — are decided at the state level.
        </p>
      </div>

      {/* Why state legislation matters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { emoji: '🏠', label: 'Housing & Zoning', desc: 'Rent control, zoning, tenant protections' },
          { emoji: '🎓', label: 'Education', desc: 'School funding, curriculum, higher ed tuition' },
          { emoji: '🏥', label: 'Healthcare', desc: 'Medicaid expansion, insurance rules, abortion access' },
        ].map(item => (
          <div key={item.label} className="card p-5">
            <span className="text-2xl mb-2 block">{item.emoji}</span>
            <p className="text-sm font-semibold text-[--text] mb-1">{item.label}</p>
            <p className="text-xs text-[--text-muted]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Interactive browser */}
      <StateBillsBrowser />
    </div>
  )
}
