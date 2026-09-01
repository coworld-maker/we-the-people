import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface MoneyStripData {
  billId: string
  code: string        // "H.R. 6644"
  title: string
  firmCount: number
  clients: string[]   // may be empty if the live lookup was unavailable
}

/**
 * The one thing no competitor can copy: real lobbying disclosures on a real
 * bill, named. Everything here is sourced — the count comes from Senate LDA
 * filings exact-matched to this bill and Congress, the names are the filing
 * clients. If the lookup is unavailable we show the count alone rather than
 * inventing anything, and if there's no lobbied bill at all we render nothing.
 *
 * Deliberately understated: stating the fact plainly is more persuasive to the
 * persuadable middle than framing it as a scandal.
 */
export default function MoneyStrip({ data }: { data: MoneyStripData | null }) {
  if (!data) return null

  return (
    <section className="border-y border-[--border] bg-[--surface-secondary]">
      <div className="max-w-5xl mx-auto px-6 py-8 sm:py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[--gold-text] mb-3">
          Follow the money
        </p>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl sm:text-3xl leading-snug text-[--accent] mb-2">
              <span className="font-display text-base font-bold align-middle mr-2 px-2 py-0.5 rounded bg-[--accent]/10">
                {data.code}
              </span>
              {data.title}
            </h2>

            <p className="text-[15px] text-[--text-secondary] leading-relaxed max-w-2xl">
              <strong className="text-[--text] font-semibold">
                {data.firmCount} {data.firmCount === 1 ? 'organization has' : 'organizations have'}
              </strong>{' '}
              filed Senate lobbying disclosures naming this bill
              {data.clients.length > 0 && (
                <>
                  {' — including '}
                  {/* Names verbatim from the filings; sized down so the caps
                      read as a citation rather than shouting. */}
                  <span className="text-[--text] font-medium text-[13px] tracking-wide">
                    {data.clients.join(' · ')}
                  </span>
                </>
              )}
              . Most people never see this.
            </p>
          </div>

          <Link
            href={`/bills/${data.billId}`}
            className="inline-flex items-center gap-2 shrink-0 px-5 py-3 rounded-[--radius] bg-[--accent] text-white font-semibold hover:bg-[--accent-hover] transition-colors"
          >
            See who&rsquo;s behind it <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-[11px] text-[--text-muted] mt-4">
          Public record, from the Senate Lobbying Disclosure Act database. A filing shows
          disclosed interest in a bill — not proof of influence.
        </p>
      </div>
    </section>
  )
}
