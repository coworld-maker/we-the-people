import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Landmark, ClipboardCheck, MapPin, Mail, Phone, ExternalLink,
  ArrowRight, CheckCircle2, UserCheck, FileText, Search,
} from 'lucide-react'
import RepFinder from '@/components/action/RepFinder'

export const metadata = {
  title: 'Civic Action Center | Democracy Unlocked',
  description: 'Register to vote, find your representatives, and take civic action.',
}

export default async function ActionCenterPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl px-5 py-8 sm:px-8 sm:py-10 mb-8 text-center">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Landmark className="w-6 h-6 text-white" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3">
          Civic Action Center
        </h1>
        <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Everything you need to participate in democracy — from voter registration
          to contacting your representatives.
        </p>
      </div>

      {/* Quick actions grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: ClipboardCheck,
            title: 'Register to Vote',
            desc: 'Check your registration status or register online in minutes.',
            href: 'https://vote.org/register-to-vote/',
            color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
            cta: 'Register now',
          },
          {
            icon: CheckCircle2,
            title: 'Check Registration',
            desc: 'Verify your voter registration status is up to date.',
            href: 'https://vote.org/am-i-registered-to-vote/',
            color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
            cta: 'Check status',
          },
          {
            icon: MapPin,
            title: 'Find Polling Place',
            desc: 'Locate your nearest polling station for upcoming elections.',
            href: 'https://vote.org/polling-place-locator/',
            color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
            cta: 'Find location',
          },
          {
            icon: Mail,
            title: 'Absentee Ballot',
            desc: 'Request an absentee or mail-in ballot for your state.',
            href: 'https://vote.org/absentee-ballot/',
            color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
            cta: 'Request ballot',
          },
          {
            icon: UserCheck,
            title: 'Election Reminders',
            desc: 'Sign up for reminders about registration deadlines and elections.',
            href: 'https://vote.org/election-reminders/',
            color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200',
            cta: 'Get reminders',
          },
          {
            icon: FileText,
            title: 'State Voting Info',
            desc: 'Learn your state\'s specific voting rules, ID requirements, and deadlines.',
            href: 'https://vote.org/voter-id-laws/',
            color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200',
            cta: 'View rules',
          },
        ].map(action => (
          <a key={action.title} href={action.href} target="_blank" rel="noopener noreferrer"
            className="card p-5 group lift"
          >
            <div className={`w-10 h-10 ${action.bg} rounded-lg flex items-center justify-center mb-4 border ${action.border} group-hover:scale-105 transition-transform`}>
              <action.icon className={`w-4 h-4 ${action.color}`} />
            </div>
            <h3 className="font-display text-sm font-bold text-[--text] mb-1 group-hover:text-[--accent] transition-colors">
              {action.title}
            </h3>
            <p className="text-xs text-[--text-secondary] leading-relaxed mb-3">{action.desc}</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[--accent]">
              {action.cta} <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>

      {/* Find your representatives */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-xl font-extrabold text-[--text]">Find Your Representatives</h2>
        </div>
        <p className="text-sm text-[--text-secondary] mb-5">
          Enter your address to find your U.S. Senators, House Representative, and state officials.
        </p>
        <RepFinder />
      </section>

      {/* Contact templates */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-[--accent]" />
          <h2 className="font-display text-xl font-extrabold text-[--text]">Contact Your Officials</h2>
        </div>
        <p className="text-sm text-[--text-secondary] mb-5">
          Ready-to-use resources for reaching your elected officials about the issues you care about.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Call the U.S. Capitol Switchboard',
              desc: 'Ask to be connected to your Senator or Representative.',
              detail: '(202) 224-3121',
              icon: Phone,
              action: 'tel:+12022243121',
              cta: 'Call now',
            },
            {
              title: 'Write to Congress',
              desc: 'Find mailing addresses and email contacts for all members.',
              detail: 'senate.gov / house.gov',
              icon: Mail,
              action: 'https://www.congress.gov/members/find-your-member',
              cta: 'Find contacts',
            },
          ].map(item => (
            <a key={item.title} href={item.action}
              target={item.action.startsWith('http') ? '_blank' : undefined}
              rel={item.action.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="card p-5 group lift"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[--accent-light] rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[--accent]" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-[--text] mb-1 group-hover:text-[--accent] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[--text-secondary] leading-relaxed mb-1">{item.desc}</p>
                  <p className="text-sm font-semibold text-[--text]">{item.detail}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[--accent] mt-2">
                    {item.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Important dates */}
      <section className="mb-10">
        <h2 className="font-display text-xl font-extrabold text-[--text] mb-4">Key Dates to Remember</h2>
        <div className="card overflow-hidden">
          <div className="divide-y divide-[--border]">
            {[
              { date: 'Ongoing', event: 'Voter registration', desc: 'Most states allow registration year-round. Some have same-day registration.' },
              { date: 'Varies by state', event: 'Primary elections', desc: 'Check your state for primary election dates and registration deadlines.' },
              { date: 'November (even years)', event: 'General elections', desc: 'Federal elections for Congress, and presidential elections every 4 years.' },
              { date: 'Year-round', event: 'Local elections', desc: 'City councils, school boards, and ballot measures happen throughout the year.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-5 py-4 sm:px-6">
                <div className="shrink-0">
                  <span className="badge bg-[--accent-light] text-[--accent] whitespace-nowrap">{item.date}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[--text]">{item.event}</h3>
                  <p className="text-xs text-[--text-secondary] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="card p-6 sm:p-8 text-center bg-[--surface-secondary]">
        <h3 className="font-display text-lg font-bold text-[--text] mb-2">Ready to make your voice heard?</h3>
        <p className="text-sm text-[--text-secondary] mb-5">
          Start by exploring current legislation and casting your votes.
        </p>
        <Link href="/bills" className="btn-primary">
          Browse bills <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
