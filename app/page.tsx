import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Vote, ArrowRight, Landmark, Scale } from 'lucide-react'
import CivicHero from '@/components/landing/CivicHero'
import MoneyStrip, { type MoneyStripData } from '@/components/landing/MoneyStrip'
import { getLobbyingForBill } from '@/lib/api/lda'
import prisma from '@/lib/prisma'
import Logo from '@/components/ui/Logo'
import CookieConsent from '@/components/legal/CookieConsent'

// ── STATIC DATA ──────────────────────────────────────────────────────────────
// One section, three steps, in the order the product is actually used — and
// leading with the differentiator (your votes next to your reps' real votes),
// not the summaries. Summaries and lobbying disclosures are supporting facts.
// Every sentence here must be literally true of the product: no headcounts
// (the true figure moves with vacancies), no "AI" in a heading.
const STEPS = [
  {
    icon: Landmark,
    title: 'See how your representatives voted',
    desc: 'Real roll-call votes from the House Clerk and Senate records, on bills that each link to their official text on Congress.gov.',
  },
  {
    icon: Vote,
    title: 'Cast your own vote',
    desc: 'Take a position on the same bills. Alongside each: a plain-English summary, and any Senate lobbying disclosures filed on it.',
  },
  {
    icon: Scale,
    title: 'See where you agree',
    desc: 'Your votes next to theirs, bill by bill — where you line up, and where you don’t.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

const BILL_TYPE_LABEL: Record<string, string> = {
  HR: 'H.R.', S: 'S.', HRES: 'H.Res.', SRES: 'S.Res.',
  HJRES: 'H.J.Res.', SJRES: 'S.J.Res.', HCONRES: 'H.Con.Res.', SCONRES: 'S.Con.Res.',
}

/**
 * Pick the most-lobbied bill we have a verified count for and, when possible,
 * name the organizations behind it. Counts come from sync-lobbying (LDA filings
 * exact-matched to the bill AND its Congress); the client names are fetched
 * live but cached 24h by lib/api/lda. Every failure path degrades to something
 * still true: names omitted, or the whole strip hidden.
 */
async function getMoneyStrip(): Promise<MoneyStripData | null> {
  try {
    const bill = await prisma.bill.findFirst({
      // Live bills only. A bill that already became law is a history lesson —
      // the strip is meant to prompt "I could still weigh in on this."
      where: {
        lobbyingFirmCount: { gt: 0 },
        status: { notIn: ['enacted', 'failed', 'vetoed'] },
      },
      orderBy: [{ lobbyingFirmCount: 'desc' }, { latestActionDate: 'desc' }],
      select: {
        id: true, billType: true, billNumber: true, congress: true,
        title: true, shortTitle: true, lobbyingFirmCount: true,
      },
    })
    if (!bill?.lobbyingFirmCount) return null

    // Only the client names are used here; the strip's count comes from the
    // stored lobbyingFirmCount above, so the capped row list is fine.
    const lobbying = await getLobbyingForBill(bill.billType, bill.billNumber, bill.congress)
      .catch(() => null)
    const filings = lobbying?.filings ?? null

    // Names are used EXACTLY as filed. Title-casing them mangles real ones
    // (NAACP -> "Naacp", "City OF Santa Clara", "Tricon Residential INC."),
    // and this is a factual citation — style it, don't rewrite it. Prefer
    // shorter names so one 60-character registrant doesn't swamp the line.
    const clients = Array.from(
      new Set((filings ?? []).map(f => f.client?.trim()).filter((c): c is string => !!c))
    )
      .sort((a, b) => a.length - b.length)
      .filter(c => c.length <= 42)
      .slice(0, 3)

    return {
      billId: bill.id,
      code: `${BILL_TYPE_LABEL[bill.billType] ?? bill.billType} ${bill.billNumber}`,
      title: bill.shortTitle || bill.title,
      firmCount: bill.lobbyingFirmCount,
      clients,
    }
  } catch {
    return null
  }
}

export default async function LandingPage() {
  const { userId } = await auth()
  const [billCount, moneyStrip] = await Promise.all([
    prisma.bill.count().catch(() => 0),
    getMoneyStrip(),
  ])

  return (
    <main className="min-h-screen bg-[--bg] text-[--text] selection:bg-[--accent] selection:text-white">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      {/* Navy to run straight into the key hero below it. */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 border-b border-white/15 bg-[#0A2463]/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-h-[44px] min-w-0 group hover:opacity-90 transition-opacity">
            <Logo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 text-[#F4F6FA]" decorative />
            <span className="font-serif text-base sm:text-lg text-white tracking-tight whitespace-nowrap">
              Democracy Unlocked<span className="align-super text-[9px] ml-0.5">™</span>
            </span>
            {/* Hidden on phones: with it, the wordmark and the CTA both wrapped at 375px. */}
            <span
              className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200"
              title="This site is in beta — expect rough edges and incomplete data while we keep building."
            >
              Beta
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {userId ? (
              <Link href="/dashboard"
                className="inline-flex items-center min-h-[44px] px-4 sm:px-5 text-sm font-semibold whitespace-nowrap rounded-[--radius] bg-[#F4F6FA] text-[#0A2463] hover:bg-white transition-colors"
              >
                Dashboard <ArrowRight className="hidden sm:block w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden sm:inline-flex items-center min-h-[44px] px-4 text-sm font-medium text-[#B7C1D8] hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/sign-up"
                  className="inline-flex items-center min-h-[44px] px-4 sm:px-5 text-sm font-semibold whitespace-nowrap rounded-[--radius] bg-[#F4F6FA] text-[#0A2463] hover:bg-white transition-colors"
                >
                  Get started <ArrowRight className="hidden sm:block w-4 h-4 ml-1.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <CivicHero billCount={billCount} signedIn={!!userId} />

      {/* The differentiator, immediately after the hero: a real bill, real
          filings, named. Renders nothing if we have no verified count. */}
      <MoneyStrip data={moneyStrip} />

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      {/* One section, composed like a document rather than a bento grid: serif
          heading on the left, a numbered list on the right. Numbering is kept
          because the order is real — you need their votes before a comparison
          means anything. One icon treatment throughout (navy on a navy tint). */}
      <section aria-labelledby="how-it-works" className="py-20 sm:py-24 px-6 bg-[--bg]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[--gold-text] mb-4">
              How it works
            </p>
            <h2 id="how-it-works" className="font-serif font-normal text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] tracking-tight text-[--accent] text-balance">
              Your votes, next to the votes that count.
            </h2>
            <p className="mt-5 text-lg text-[--text-secondary] leading-relaxed max-w-md">
              Vote on the same bills Congress votes on, and see how your record compares
              with the people who represent you.
            </p>
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
                  <p className="mt-2 text-[--text-secondary] leading-relaxed max-w-xl">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      {/* Flat navy, like the hero. No gradient: blue→red read as the two
          parties. White on #0A2463 is ~14:1; #C8D0E2 sub-line is ~10:1. */}
      <section className="px-6 pb-20 sm:pb-24 bg-[--bg]">
        <div className="max-w-6xl mx-auto rounded-2xl bg-[#0A2463] px-8 py-14 sm:px-16 sm:py-20">
          <div className="max-w-3xl">
            <h2 className="font-serif font-normal text-3xl sm:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-white text-balance">
              See how often your representatives vote the way you would.
            </h2>
            <p className="mt-5 text-lg text-[#C8D0E2]">
              Free to use, with every vote drawn from the official congressional record.
            </p>
            <Link
              href={userId ? '/dashboard' : '/sign-up'}
              className="mt-9 inline-flex items-center justify-center min-h-[48px] px-7 text-base font-semibold rounded-[--radius] bg-[#E8B33C] text-[#0A2463] hover:bg-[#F0C35A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              Get started — it&rsquo;s free <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-[--surface] py-10 px-6 border-t border-[--border]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[--accent]">
            <Logo className="w-6 h-6" decorative />
            <span className="font-display text-sm font-semibold text-[--text-secondary]">Democracy Unlocked<span className="align-super text-[8px] ml-0.5">™</span></span>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium text-[--text-muted]">
            <Link href="/about" className="inline-flex items-center min-h-[44px] px-2 hover:text-[--accent] transition-colors">About</Link>
            <Link href="/privacy" className="inline-flex items-center min-h-[44px] px-2 hover:text-[--accent] transition-colors">Privacy</Link>
            <Link href="/terms" className="inline-flex items-center min-h-[44px] px-2 hover:text-[--accent] transition-colors">Terms</Link>
          </nav>
          <p className="text-xs text-[--text-muted]">
            &copy; {new Date().getFullYear()} Democracy Unlocked&trade;. &ldquo;Democracy Unlocked&rdquo; and the logo are trademarks of Democracy Unlocked.
          </p>
        </div>
      </footer>

      {/* GDPR cookie banner — renders only when the user hasn't decided yet */}
      <CookieConsent />
    </main>
  )
}
