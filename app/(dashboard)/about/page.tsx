import {
  Vote, BookOpen, BarChart3, Shield, Lock, Eye,
  Scale, Heart, Code, ArrowRight, CheckCircle2, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'About | Democracy Unlocked',
  description: 'Our mission to make civic engagement accessible to everyone.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-5 py-8 sm:px-8 sm:py-10 mb-10 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Vote className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
          About Democracy Unlocked
        </h1>
        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          We believe democracy works better when citizens have the tools to understand,
          engage with, and influence the legislation that shapes their lives.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-14">
        <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">Our mission</p>
        <h2 className="font-display text-2xl font-extrabold text-[--text] mb-4">
          Closing the gap between citizens and Congress
        </h2>
        <div className="text-[--text-secondary] leading-relaxed space-y-4">
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

      {/* How it works */}
      <section className="mb-14">
        <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">How it works</p>
        <h2 className="font-display text-2xl font-extrabold text-[--text] mb-6">Three steps to informed civic participation</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen, step: '01', title: 'Read',
              desc: 'Every bill is analyzed by AI to produce a plain-language summary, balanced pros and cons, and impact assessment across demographics.',
            },
            {
              icon: Vote, step: '02', title: 'Vote',
              desc: 'Cast your position on real Congressional bills. Your vote is anonymous and private. Track your voting history and see how your views evolve.',
            },
            {
              icon: BarChart3, step: '03', title: 'Understand',
              desc: 'See how citizens across the platform feel about every bill. Explore policy areas, compare perspectives, and engage in moderated discussions.',
            },
          ].map(item => (
            <div key={item.title} className="card p-6 relative">
              <span className="absolute top-4 right-4 font-display text-xs font-bold text-[--text-muted]">{item.step}</span>
              <div className="w-10 h-10 bg-[--accent-light] rounded-lg flex items-center justify-center mb-4">
                <item.icon className="w-4 h-4 text-[--accent]" />
              </div>
              <h3 className="font-display text-base font-bold text-[--text] mb-2">{item.title}</h3>
              <p className="text-sm text-[--text-secondary] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mb-14">
        <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">Our principles</p>
        <h2 className="font-display text-2xl font-extrabold text-[--text] mb-6">What we stand for</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
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
          ].map(item => (
            <div key={item.title} className="flex items-start gap-4 p-5 bg-[--surface-secondary] rounded-xl">
              <div className="w-9 h-9 bg-[--surface] rounded-lg flex items-center justify-center shrink-0 border border-[--border]">
                <item.icon className="w-4 h-4 text-[--accent]" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-[--text] mb-1">{item.title}</h3>
                <p className="text-sm text-[--text-secondary] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">FAQ</p>
        <h2 className="font-display text-2xl font-extrabold text-[--text] mb-6">Common questions</h2>

        <div className="space-y-4">
          {[
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
          ].map((faq, i) => (
            <div key={i} className="card p-5">
              <h3 className="font-display text-sm font-bold text-[--text] mb-2">{faq.q}</h3>
              <p className="text-sm text-[--text-secondary] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-14">
        <p className="text-sm font-semibold text-[--accent] uppercase tracking-wider mb-3">Data sources</p>
        <h2 className="font-display text-2xl font-extrabold text-[--text] mb-4">Where our data comes from</h2>
        <div className="space-y-3">
          {[
            { label: 'Bill data, text, and status', source: 'Congress.gov API', url: 'https://api.congress.gov' },
            { label: 'AI summaries and analysis', source: 'Anthropic Claude', url: 'https://www.anthropic.com' },
            { label: 'User authentication', source: 'Clerk', url: 'https://clerk.com' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-4 bg-[--surface-secondary] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[--text]">{item.label}</p>
                <p className="text-xs text-[--text-muted]">{item.source}</p>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[--accent] font-medium flex items-center gap-1 hover:text-[--accent-hover] transition-colors"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient rounded-2xl px-5 py-8 sm:px-8 sm:py-10 text-center">
        <h2 className="font-display text-2xl font-extrabold text-white mb-3">Ready to get involved?</h2>
        <p className="text-white/70 mb-6">Start exploring legislation and casting your votes today.</p>
        <Link href="/bills" className="btn-primary px-6 py-3 rounded-xl">
          Browse bills <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
