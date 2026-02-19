import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, BookOpen, Scale, Building, Vote, DollarSign,
  Users, Clock, ArrowRight, ChevronRight, Lightbulb, MapPin,
} from 'lucide-react'

export const metadata = {
  title: 'Learn | Democracy Unlocked',
  description: 'Civic education resources to help you understand how government works.',
}

const GUIDES = [
  {
    id: 'how-a-bill-becomes-law',
    icon: BookOpen,
    category: 'Legislation',
    title: 'How a Bill Becomes Law',
    desc: 'The step-by-step journey from idea to law, explained simply.',
    readTime: '3 min',
    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200',
    content: [
      { heading: 'Introduction', text: 'Any member of Congress can introduce a bill — a proposed law. Thousands are introduced every session, but only a small fraction become law. Here\'s how the process works.' },
      { heading: '1. Introduction', text: 'A Senator or Representative introduces a bill. It gets assigned a number (like H.R. 1 for House bills or S. 1 for Senate bills) and sent to the relevant committee.' },
      { heading: '2. Committee Review', text: 'Congressional committees study the bill, hold hearings, and may make changes (called "markups"). Most bills die in committee — only the most supported ones move forward.' },
      { heading: '3. Floor Debate', text: 'If the committee approves the bill, it goes to the full House or Senate for debate. Members discuss, propose amendments, and eventually vote.' },
      { heading: '4. The Other Chamber', text: 'If one chamber passes the bill, it goes to the other chamber (House → Senate or Senate → House) for the same process. Both must pass an identical version.' },
      { heading: '5. Conference Committee', text: 'If the two chambers pass different versions, a conference committee works out the differences. Both chambers must then approve the final version.' },
      { heading: '6. Presidential Action', text: 'The President can sign the bill into law or veto it. Congress can override a veto with a two-thirds vote in both chambers.' },
    ],
  },
  {
    id: 'three-branches',
    icon: Building,
    category: 'Government Structure',
    title: 'The Three Branches of Government',
    desc: 'How the executive, legislative, and judicial branches share power.',
    readTime: '2 min',
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
    content: [
      { heading: 'Separation of Powers', text: 'The U.S. Constitution divides federal power among three branches to prevent any one group from having too much control. This is called "checks and balances."' },
      { heading: 'Legislative Branch (Congress)', text: 'Made up of the Senate (100 members, 2 per state) and the House of Representatives (435 members, based on population). Congress writes laws, controls the budget, and can declare war.' },
      { heading: 'Executive Branch (President)', text: 'The President enforces laws, commands the military, conducts foreign policy, and can veto legislation. The executive branch includes federal agencies like the DOJ, EPA, and more.' },
      { heading: 'Judicial Branch (Courts)', text: 'The Supreme Court and federal courts interpret laws and determine whether they\'re constitutional. Judges are appointed for life to insulate them from political pressure.' },
      { heading: 'Checks and Balances', text: 'Each branch can limit the others: Congress can override vetoes, the President nominates judges, and courts can strike down unconstitutional laws.' },
    ],
  },
  {
    id: 'local-government',
    icon: MapPin,
    category: 'Local Government',
    title: 'What Local Government Controls',
    desc: 'Schools, police, zoning, taxes — more than you think.',
    readTime: '3 min',
    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
    content: [
      { heading: 'Why It Matters', text: 'Local government decisions affect your daily life more directly than federal policy. Your property taxes, schools, roads, police, parks, and zoning are all decided locally.' },
      { heading: 'City/Town Council', text: 'Your local council or board of aldermen passes ordinances (local laws), sets the budget, and makes decisions about development, public safety, and services.' },
      { heading: 'School Boards', text: 'Elected school board members set curriculum standards, approve budgets, hire superintendents, and make policies affecting thousands of students.' },
      { heading: 'County Government', text: 'Counties handle courts, jails, property records, elections, and often roads and public health. County commissioners or supervisors make these decisions.' },
      { heading: 'How to Get Involved', text: 'Attend city council meetings (many are open to the public), vote in local elections (turnout is typically very low), and consider running for office yourself.' },
    ],
  },
  {
    id: 'understanding-taxes',
    icon: DollarSign,
    category: 'Fiscal Policy',
    title: 'Understanding Property Taxes',
    desc: 'Where your property tax dollars go and how they\'re calculated.',
    readTime: '2 min',
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    content: [
      { heading: 'What Are Property Taxes?', text: 'Property taxes are annual taxes charged on real estate based on the assessed value of your property. They\'re the primary funding source for local services.' },
      { heading: 'How They\'re Calculated', text: 'Your local assessor estimates your property\'s market value, then applies a tax rate (called a "mill rate"). For example, a $300,000 home at a 1.5% rate = $4,500/year.' },
      { heading: 'Where the Money Goes', text: 'Typically: 40-60% to schools, 15-25% to municipal services (police, fire, roads), 10-15% to county government, and the rest to special districts (libraries, parks).' },
      { heading: 'How to Influence Rates', text: 'Attend school board budget hearings, vote on bond measures, and participate in city budget discussions. These directly affect your tax rate.' },
    ],
  },
  {
    id: 'how-voting-works',
    icon: Vote,
    category: 'Voting',
    title: 'How Voting Works in America',
    desc: 'Registration, primaries, general elections, and the Electoral College.',
    readTime: '3 min',
    color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200',
    content: [
      { heading: 'Registration', text: 'Most states require you to register before you can vote. Some offer same-day registration. You can register online, by mail, or in person at your local election office.' },
      { heading: 'Primary Elections', text: 'Parties hold primaries to choose their candidates. Some states have "open" primaries (anyone can vote in either party\'s primary) while others are "closed" (party members only).' },
      { heading: 'General Elections', text: 'Federal general elections happen on the first Tuesday after November 1 in even-numbered years. You vote for your House representative every 2 years, Senators every 6 years, and President every 4 years.' },
      { heading: 'The Electoral College', text: 'Presidents aren\'t elected by popular vote alone. Each state gets electors equal to its Congressional delegation. Most states award all their electoral votes to the popular vote winner.' },
      { heading: 'Local Elections', text: 'City councils, school boards, judges, sheriffs, and ballot measures are decided in local elections — often with very low turnout. Your vote carries enormous weight.' },
    ],
  },
  {
    id: 'congress-101',
    icon: Scale,
    category: 'Congress',
    title: 'Congress 101: Senate vs. House',
    desc: 'The key differences and why they matter.',
    readTime: '2 min',
    color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200',
    content: [
      { heading: 'The Senate', text: '100 members — 2 per state regardless of population. Senators serve 6-year terms. The Senate confirms presidential appointments, ratifies treaties, and conducts impeachment trials.' },
      { heading: 'The House', text: '435 members — distributed by state population. Representatives serve 2-year terms. The House initiates revenue bills, brings impeachment charges, and elects the President if no candidate gets 270 electoral votes.' },
      { heading: 'Key Differences', text: 'The Senate is designed to be deliberate (longer terms, smaller body). The House is designed to be responsive to the public (shorter terms, proportional). The Senate has the filibuster; the House has strict time limits on debate.' },
      { heading: 'Working Together', text: 'Both chambers must pass identical versions of a bill for it to become law. This often requires negotiation and compromise.' },
    ],
  },
]

export default async function LearnPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-8 py-10 mb-8 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Civic Education Hub
        </h1>
        <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
          Short, clear explainers on how government works, how laws are made,
          and how to make your voice count.
        </p>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <span className="badge bg-[--accent-light] text-[--accent]">{GUIDES.length} guides</span>
        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">2-3 min reads</span>
        <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">Plain language</span>
      </div>

      {/* Guide grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {GUIDES.map(guide => (
          <Link key={guide.id} href={`/learn/${guide.id}`}
            className="card-interactive p-5 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${guide.bg} rounded-lg flex items-center justify-center border ${guide.border}`}>
                <guide.icon className={`w-4 h-4 ${guide.color}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-[--surface-secondary] text-[--text-muted] border border-[--border]">{guide.readTime}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[--text-muted] group-hover:text-[--accent] transition-colors" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[--text-muted] uppercase tracking-wider">{guide.category}</span>
            <h3 className="font-display text-base font-bold text-[--text] mb-1 group-hover:text-[--accent] transition-colors mt-1">
              {guide.title}
            </h3>
            <p className="text-sm text-[--text-secondary] leading-relaxed">{guide.desc}</p>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="card p-8 text-center bg-[--surface-secondary]">
        <Lightbulb className="w-8 h-8 text-[--accent] mx-auto mb-3 opacity-60" />
        <h3 className="font-display text-lg font-bold text-[--text] mb-2">Put your knowledge into practice</h3>
        <p className="text-sm text-[--text-secondary] mb-5 max-w-md mx-auto">
          Now that you understand how government works, start voting on real legislation
          and engaging with your representatives.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/bills" className="btn-primary">Browse bills <ArrowRight className="w-3.5 h-3.5" /></Link>
          <Link href="/action-center" className="btn-secondary">Civic Action Center <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>
    </div>
  )
}
