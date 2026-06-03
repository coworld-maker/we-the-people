import Link from 'next/link'
import {
  Search, ThumbsUp, Users, Mail, Phone, MapPin,
  ChevronRight, BookOpen, Landmark, MessageSquare,
  ArrowRight, CheckCircle2, Info,
} from 'lucide-react'

// ─── How a bill becomes law ──────────────────────────────────────────────────
const BILL_STEPS = [
  {
    num: '1',
    title: 'A member of Congress writes a bill',
    body: 'Any senator or House representative can draft proposed legislation — this is how every law starts. The bill gets assigned a number (like HR 9062 for a House bill, or S 45 for a Senate bill).',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    dot: 'bg-blue-500',
  },
  {
    num: '2',
    title: 'The bill goes to committee',
    body: 'A small group of legislators reviews the bill in detail — they can approve it, change it, or kill it. Most bills never make it out of committee. On Democracy Unlocked this shows as "In Committee."',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    dot: 'bg-violet-500',
  },
  {
    num: '3',
    title: 'The full chamber debates and votes',
    body: 'If the committee approves it, the full House or Senate discusses and votes. A simple majority (218 of 435 in the House, 51 of 100 in the Senate) is needed to pass.',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    num: '4',
    title: 'The other chamber repeats the process',
    body: 'A House bill goes to the Senate, and vice versa. Both chambers must agree on the exact same text. If they pass different versions, negotiators work out the differences.',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    dot: 'bg-orange-500',
  },
  {
    num: '5',
    title: 'The President signs or vetoes',
    body: 'Once both chambers agree, the bill goes to the President. A signature makes it law. A veto sends it back — Congress can override with a two-thirds majority in both chambers.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-500',
  },
]

// ─── App guide steps ─────────────────────────────────────────────────────────
const APP_STEPS = [
  {
    icon: Search,
    color: 'bg-blue-100 text-blue-600',
    title: 'Find a bill',
    body: 'Go to Bills in the top navigation. You can search by keyword, filter by topic, or tap "Moving this week" to see what\'s currently active in Congress.',
    cta: { label: 'Browse bills', href: '/bills' },
  },
  {
    icon: BookOpen,
    color: 'bg-violet-100 text-violet-600',
    title: 'Read the AI summary',
    body: 'Each bill page has an AI-generated plain-English summary — no legal jargon. You\'ll also see the pros, cons, and which groups are affected. Always check the original bill text for important decisions.',
    cta: null,
  },
  {
    icon: ThumbsUp,
    color: 'bg-amber-100 text-amber-600',
    title: 'Cast your vote',
    body: 'Tell us whether you support or oppose the bill — or abstain. Your vote is private. It\'s added to the community count so others can see how citizens feel.',
    cta: null,
  },
  {
    icon: Mail,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Contact your representative',
    body: 'After voting, tap "Let your rep know." This gives you a pre-written letter based on your position. You copy it and send it yourself — see below for exactly how.',
    cta: null,
  },
  {
    icon: Users,
    color: 'bg-rose-100 text-rose-600',
    title: 'See how your reps voted',
    body: 'Visit My Representatives to see your senators and House member. Once you\'ve voted on enough bills, you\'ll see an agreement percentage — how often your position matches their actual vote.',
    cta: { label: 'My representatives', href: '/my-representatives' },
  },
]

export default function GetStartedPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">

      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-6 py-8 sm:px-10 sm:py-10 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-6 h-6 opacity-80" />
          <span className="text-sm font-semibold opacity-80 uppercase tracking-wider">Getting started</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight mb-3">
          Your guide to Democracy Unlocked
        </h1>
        <p className="text-white/80 text-base leading-relaxed max-w-xl">
          Democracy Unlocked shows you what Congress is working on, lets you weigh in on real legislation, and connects your opinion directly to your elected representatives. Here's everything you need to know to get going.
        </p>
      </div>

      {/* ── Section 1: How to use the app ── */}
      <section>
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-5 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[--accent] text-white text-sm font-bold flex items-center justify-center shrink-0">A</span>
          How to use this app — 5 steps
        </h2>

        <div className="space-y-4">
          {APP_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="card p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[--text-muted]">Step {i + 1}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[--text] leading-snug mb-1">{step.title}</h3>
                  <p className="text-sm text-[--text-secondary] leading-relaxed">{step.body}</p>
                  {step.cta && (
                    <Link href={step.cta.href} className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[--accent] hover:text-[--accent-dark] transition-colors">
                      {step.cta.label} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Section 2: What is HR, S, HRES? ── */}
      <section className="card p-6">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-1 flex items-center gap-2">
          <Info className="w-5 h-5 text-[--accent]" />
          What do those bill codes mean? (HR, S, HRES…)
        </h2>
        <p className="text-sm text-[--text-muted] mb-4">Every bill has a code that tells you where it started and what type it is.</p>
        <div className="space-y-2">
          {[
            { code: 'HR', full: 'House Bill', desc: 'Proposed law starting in the House of Representatives' },
            { code: 'S',  full: 'Senate Bill', desc: 'Proposed law starting in the Senate' },
            { code: 'HRES', full: 'House Resolution', desc: 'House-only — often ceremonial, does not become law' },
            { code: 'SRES', full: 'Senate Resolution', desc: 'Senate-only — often ceremonial, does not become law' },
            { code: 'HJRES', full: 'House Joint Resolution', desc: 'Both chambers + presidential signature — used for amendments and emergency spending' },
            { code: 'SJRES', full: 'Senate Joint Resolution', desc: 'Same as HJRES but starts in the Senate' },
          ].map(r => (
            <div key={r.code} className="flex items-start gap-3 py-2 border-b border-[--border] last:border-0">
              <span className="badge bg-[--dark] text-white shrink-0 w-20 justify-center">{r.code}</span>
              <div>
                <p className="text-sm font-semibold text-[--text]">{r.full}</p>
                <p className="text-xs text-[--text-muted]">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[--text-muted] mt-3 pt-3 border-t border-[--border]">
          The <strong>number</strong> (e.g. 9062 in "HR 9062") is simply the sequential order the bill was introduced in that Congress — higher numbers are more recently introduced.
        </p>
      </section>

      {/* ── Section 3: How to contact your rep ── */}
      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[--border] bg-emerald-50">
          <h2 className="font-display text-xl font-extrabold text-[--text] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            How to contact your representative
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[--text-secondary] leading-relaxed">
            After you vote on a bill, you'll see a <strong>"Let your rep know"</strong> button. Here's exactly what happens and what you do next:
          </p>

          <div className="space-y-3">
            {[
              {
                num: '1',
                icon: ThumbsUp,
                title: 'Vote on the bill',
                body: 'Cast your Yes / No / Abstain vote. The contact option appears immediately after.',
              },
              {
                num: '2',
                icon: Mail,
                title: 'Get your pre-drafted letter',
                body: 'Democracy Unlocked writes a short, professional letter for you — filled in with the bill name and your position. You can edit it however you like.',
              },
              {
                num: '3',
                icon: CheckCircle2,
                title: 'Copy the letter',
                body: 'Tap "Copy letter." The text is now on your clipboard.',
              },
              {
                num: '4',
                icon: ArrowRight,
                title: 'Send it through your rep\'s official website',
                body: 'Visit your representative\'s contact page — every member of Congress has one. Paste your letter into their contact form and submit. This goes directly to their office.',
              },
              {
                num: '5',
                icon: Phone,
                title: 'Or call the Capitol Switchboard',
                body: 'Call (202) 224-3121 — this is the main switchboard for Congress. Ask to be connected to your senator or representative by name. A 30-second call to a staffer is one of the most effective ways to make your voice heard.',
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.num} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {s.num}
                    </div>
                    {parseInt(s.num) < 5 && <div className="w-px flex-1 bg-[--border] mt-1 mb-1 min-h-[16px]" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold text-[--text]">{s.title}</p>
                    <p className="text-sm text-[--text-secondary] leading-relaxed mt-0.5">{s.body}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> Democracy Unlocked does <em>not</em> send anything on your behalf. You are always in control of what you send and when. The tool just saves you time drafting.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: How to find your district ── */}
      <section className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-[--border] bg-blue-50">
          <h2 className="font-display text-xl font-extrabold text-[--text] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            How to find your congressional district
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[--text-secondary] leading-relaxed">
            The United States is divided into 435 congressional districts — one per House representative. Each district has one person in the House of Representatives speaking specifically for it. Senators represent the whole state.
          </p>

          <div className="space-y-3">
            {[
              { step: '1', text: 'Go to My Representatives (under Representatives in the top navigation).' },
              { step: '2', text: 'Select your state on the map. You\'ll see both of your US Senators — they represent the whole state.' },
              { step: '3', text: 'Look for the zip code box below the state banner. Type in your 5-digit zip code and tap Find.' },
              { step: '4', text: 'The app will show your specific district number and your district\'s House representative — the one person elected specifically to represent your neighborhood in Congress.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <Link href="/my-representatives" className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Find my representatives <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Section 5: How a bill becomes law ── */}
      <section>
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-2 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-[--accent]" />
          How a bill becomes law — the 5 steps
        </h2>
        <p className="text-sm text-[--text-muted] mb-5">
          Want to start a law? Here's the process from idea to legislation. Only members of Congress can formally introduce a bill — but <em>anyone</em> can write a draft and ask their representative to introduce it.
        </p>

        <div className="relative pl-6 border-l-2 border-[--border] space-y-0">
          {BILL_STEPS.map((step, i) => (
            <div key={i} className={`relative pb-6 ${i === BILL_STEPS.length - 1 ? 'pb-0' : ''}`}>
              {/* dot */}
              <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-white ${step.dot}`} />
              <div className={`rounded-xl border p-4 ${step.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Step {step.num}</span>
                </div>
                <h3 className="font-display text-base font-bold leading-snug mb-1">{step.title}</h3>
                <p className="text-sm leading-relaxed opacity-80">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 card p-5">
          <p className="text-sm text-[--text-secondary] leading-relaxed">
            <strong className="text-[--text]">Want to help start a law?</strong> Draft your idea and contact your representative through their official website. Their staff regularly receives constituent proposals — especially on issues that matter to their district. You can find your rep's contact page from{' '}
            <Link href="/my-representatives" className="text-[--accent] hover:underline font-medium">My Representatives</Link>.
          </p>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-4 bg-[--accent]/5 border-[--accent]/20">
        <div className="flex-1">
          <p className="font-display text-base font-bold text-[--text] mb-1">Ready to dive in?</p>
          <p className="text-sm text-[--text-muted]">Start by browsing active bills — find one that affects your community and cast your first vote.</p>
        </div>
        <Link href="/bills?moving=1" className="btn-primary shrink-0 flex items-center gap-2 whitespace-nowrap">
          Browse active bills <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  )
}
