import {
  Vote, BookOpen, BarChart3, Shield, Lock, Eye,
  Scale, Heart, Code, ArrowRight, ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'About', // the root layout's template appends "| Democracy Unlocked"
  description: 'Our mission to make civic engagement accessible to everyone.',
}

// Same composition as the landing page: gold eyebrow, serif headings, flat
// navy bands (no gradients), lists ruled like a document rather than cards.
const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.14em] text-[--gold-text] mb-4'
const H2 = 'font-serif font-normal text-3xl sm:text-4xl leading-[1.15] tracking-tight text-[--accent] text-balance'

const STEPS = [
  {
    icon: BookOpen, title: 'Read',
    desc: 'Every bill is analyzed by AI to produce a plain-language summary, balanced pros and cons, and impact assessment across demographics.',
  },
  {
    icon: Vote, title: 'Vote',
    desc: 'Cast your position on real Congressional bills. Your vote is anonymous and private. Track your voting history and see how your views evolve.',
  },
  {
    icon: BarChart3, title: 'Understand',
    desc: 'See how citizens across the platform feel about every bill. Explore policy areas, compare perspectives, and engage in moderated discussions.',
  },
]

const PRINCIPLES = [
  {
    icon: Scale, title: 'Nonpartisan',
    desc: 'We never take sides. Every analysis presents arguments for and against, sourced from multiple perspectives. Our job is to inform, not persuade.',
  },
  {
    icon: Lock, title: 'Privacy-first',
    desc: 'Your votes are anonymous. We don\'t sell data, don\'t track behavior for ads, and don\'t share personal information with anyone.',
  },
  {
    icon: Eye, title: 'Transparent',
    desc: 'Our methodology is open. AI summaries are labeled as AI-generated. We link to original bill text on Congress.gov so you can always verify.',
  },
  {
    icon: Heart, title: 'Free forever',
    desc: 'Civic tools should never be behind a paywall. Democracy Unlocked is free to use and will remain so. Democracy belongs to everyone.',
  },
  {
    icon: Shield, title: 'Moderated',
    desc: 'Discussions are moderated to maintain respectful, constructive dialogue. We believe disagreement is healthy — incivility is not.',
  },
  {
    icon: Code, title: 'Open source',
    desc: 'Our code is publicly available on GitHub. We believe in building trust through transparency and community accountability.',
  },
]

const FAQS = [
  {
    q: 'Are votes on this platform real?',
    a: 'Your votes here are a form of citizen expression — they reflect your position on legislation. They are not official Congressional votes, but they do contribute to a public sentiment picture that shows how citizens feel about real bills.',
  },
  {
    q: 'How does the AI analysis work?',
    a: 'We use large language models to analyze the full text of each bill and generate plain-language summaries, balanced arguments for and against, and impact assessments. AI output is always labeled and linked to the original source text.',
  },
  {
    q: 'Is this affiliated with the U.S. Government?',
    a: 'No. Democracy Unlocked is an independent civic technology platform. Bill data is sourced from the public Congress.gov API.',
  },
  {
    q: 'How is my data used?',
    a: 'Your vote data is aggregated anonymously to show public sentiment. We do not sell personal data, serve targeted ads, or share individual voting records with anyone.',
  },
  {
    q: 'Can I see the source code?',
    a: 'Yes. The project is open source on GitHub. We welcome contributions and feedback from the community.',
  },
]

const SOURCES = [
  { label: 'Bill data, text, and status', source: 'Congress.gov API', url: 'https://api.congress.gov' },
  { label: 'House roll-call votes', source: 'Office of the Clerk, U.S. House', url: 'https://clerk.house.gov/Votes' },
  { label: 'Senate roll-call votes', source: 'U.S. Senate', url: 'https://www.senate.gov/legislative/votes_new.htm' },
  { label: 'Lobbying disclosures', source: 'Senate Lobbying Disclosure Act database', url: 'https://lda.senate.gov' },
  { label: 'AI summaries and analysis', source: 'Anthropic Claude', url: 'https://www.anthropic.com' },
  { label: 'User authentication', source: 'Clerk', url: 'https://clerk.com' },
]

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero — flat navy, like the landing hero. White on #0A2463 is ~14:1. */}
      <header className="rounded-2xl bg-[#0A2463] px-6 py-12 sm:px-12 sm:py-16 mb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#E8B33C] mb-4">
          About · Independent · nonpartisan
        </p>
        <h1 className="font-serif font-normal text-4xl sm:text-5xl leading-[1.1] tracking-tight text-white text-balance max-w-3xl">
          Closing the gap between citizens and Congress.
        </h1>
        <p className="mt-5 text-lg text-[#C8D0E2] leading-relaxed max-w-2xl">
          We believe democracy works better when citizens have the tools to understand,
          engage with, and influence the legislation that shapes their lives.
        </p>
      </header>

      {/* Meet the founder — the founder's own words. Don't add claims here. */}
      <section aria-labelledby="founder" className="mb-20 flex flex-col sm:flex-row gap-6 sm:gap-10 sm:items-start">
        <Image
          src="/founder.jpg"
          alt="Coleman Dumas IV, founder of Democracy Unlocked"
          width={160}
          height={160}
          className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover shrink-0 ring-1 ring-[--border]"
        />
        <div className="min-w-0">
          <p className={EYEBROW}>Meet the founder</p>
          <h2 id="founder" className={H2}>Coleman Dumas IV</h2>
          <div className="mt-5 text-lg text-[--text-secondary] leading-relaxed space-y-4 max-w-2xl">
            <p>
              I built Democracy Unlocked because the votes that shape our lives are public, yet
              finding them, and making sense of them, takes more time than most people have.
            </p>
            <p>
              Every vote here comes from the official congressional record. Enter your ZIP, see
              what your representatives did, and decide for yourself whether they voted the way
              you would.
            </p>
          </div>
        </div>
      </section>

      {/* Mission — serif heading left, text right, as on the landing page. */}
      <section aria-labelledby="mission" className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-5">
          <p className={EYEBROW}>Our mission</p>
          <h2 id="mission" className={H2}>Information, so you can think for yourself.</h2>
        </div>
        <div className="lg:col-span-7 text-lg text-[--text-secondary] leading-relaxed space-y-4">
          <p>
            Most Americans care deeply about the issues affecting their communities. Yet the
            legislative process remains opaque, jargon-heavy, and difficult to follow. The result
            is a gap between what Congress does and what citizens understand.
          </p>
          <p>
            Democracy Unlocked bridges that gap. We use AI to translate complex legislation
            into plain language, provide balanced analysis of every bill, and give citizens
            a platform to vote, discuss, and track their civic engagement over time.
          </p>
          <p>
            This is not about telling people what to think. It&apos;s about giving them the
            information they need to think for themselves.
          </p>
        </div>
      </section>

      {/* How it works — numbered, because the order is real. */}
      <section aria-labelledby="how" className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-5">
          <p className={EYEBROW}>How it works</p>
          <h2 id="how" className={H2}>Read, vote, understand.</h2>
        </div>
        <ol className="lg:col-span-7 border-t border-[--border]">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-5 sm:gap-6 py-7 border-b border-[--border]">
              <span className="font-serif text-2xl leading-none text-[--gold-text] w-6 shrink-0 pt-1 tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="flex items-center gap-3 font-serif font-normal text-xl sm:text-2xl leading-snug text-[--text]">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[--accent-light] shrink-0" aria-hidden="true">
                    <step.icon className="w-[18px] h-[18px] text-[--accent]" />
                  </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-[--text-secondary] leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Principles — nonpartisan first: it's the platform's staple. */}
      <section aria-labelledby="principles" className="mb-20">
        <p className={EYEBROW}>Our principles</p>
        <h2 id="principles" className={`${H2} mb-8`}>What we stand for.</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 border-t border-[--border]">
          {PRINCIPLES.map(item => (
            <li key={item.title} className="flex gap-4 py-6 border-b border-[--border]">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[--accent-light] shrink-0" aria-hidden="true">
                <item.icon className="w-[18px] h-[18px] text-[--accent]" />
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-[--text]">{item.title}</h3>
                <p className="mt-1.5 text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-5">
          <p className={EYEBROW}>FAQ</p>
          <h2 id="faq" className={H2}>Common questions.</h2>
        </div>
        <dl className="lg:col-span-7 border-t border-[--border]">
          {FAQS.map(faq => (
            <div key={faq.q} className="py-6 border-b border-[--border]">
              <dt className="font-serif text-xl text-[--text]">{faq.q}</dt>
              <dd className="mt-2 text-[--text-secondary] leading-relaxed">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Data sources */}
      <section aria-labelledby="sources" className="mb-20">
        <p className={EYEBROW}>Data sources</p>
        <h2 id="sources" className={`${H2} mb-8`}>Where our data comes from.</h2>
        <ul className="border-t border-[--border]">
          {SOURCES.map(item => (
            <li key={item.label} className="flex items-center justify-between gap-4 py-4 border-b border-[--border]">
              <div className="min-w-0">
                <p className="font-medium text-[--text]">{item.label}</p>
                <p className="text-sm text-[--text-muted]">{item.source}</p>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 min-h-[44px] px-2 text-sm font-medium text-[--accent] hover:text-[--accent-hover] transition-colors"
              >
                Visit <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sr-only">{item.source} (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA — flat navy with the gold button, matching the landing page. */}
      <section className="rounded-2xl bg-[#0A2463] px-6 py-12 sm:px-12 sm:py-16">
        <h2 className="font-serif font-normal text-3xl sm:text-4xl leading-[1.15] tracking-tight text-white text-balance max-w-2xl">
          See what Congress is doing.
        </h2>
        <p className="mt-4 text-lg text-[#C8D0E2]">Start exploring legislation and casting your votes today.</p>
        <Link
          href="/bills"
          className="mt-8 inline-flex items-center justify-center min-h-[48px] px-7 text-base font-semibold rounded-[--radius] bg-[#E8B33C] text-[#0A2463] hover:bg-[#F0C35A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
        >
          Browse bills <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
