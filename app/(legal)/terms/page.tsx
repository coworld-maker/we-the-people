import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service',
  description: 'The rules of using Democracy Unlocked.',
}

const LAST_UPDATED = 'May 24, 2026'

export default function TermsOfServicePage() {
  return (
    <article className="prose-legal">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Back home
      </Link>

      <h1>Terms of Service</h1>
      <p className="text-sm text-[--text-muted]">Last updated: {LAST_UPDATED}</p>

      <p className="lead">
        These terms govern your use of Democracy Unlocked. By creating an account
        or using the site, you agree to them. If you don't agree, please don't
        use the site.
      </p>

      <h2>1. What we provide</h2>
      <p>
        Democracy Unlocked is a free, nonpartisan platform that lets US citizens
        read summaries of pending Congressional legislation, record their own
        positions, discuss bills with other users, and compare their views to
        their elected representatives. All bill and voting data comes from
        public government sources. AI-generated summaries are meant as a
        starting point, not as legal advice or as a substitute for the original
        legislative text.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must be at least 13 years old (16 in the EU/EEA) to create an account.</li>
        <li>One account per person. Don't share your login or impersonate others.</li>
        <li>Keep your credentials secure — you're responsible for activity under your account.</li>
        <li>We can suspend or terminate accounts that violate these terms or applicable law.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Harass, threaten, dox, or impersonate other users.</li>
        <li>Post content that's illegal, defamatory, or infringes someone else's rights.</li>
        <li>Spam, scrape, or attempt to manipulate vote counts or sentiment data.</li>
        <li>Attempt to interfere with the site's operation, probe for vulnerabilities outside a coordinated disclosure process, or circumvent security controls.</li>
        <li>Use the site to organize voter intimidation or to suppress lawful civic participation.</li>
      </ul>
      <p>
        Violations may result in content removal, account suspension, or
        permanent termination — at our discretion and without refund (the site
        is free, but the principle applies).
      </p>

      <h2>4. User-generated content</h2>
      <p>
        You retain ownership of comments and discussions you post. By posting,
        you grant us a nonexclusive, royalty-free, worldwide license to display,
        store, and distribute that content on the platform.
      </p>
      <p>
        We may moderate content — remove, edit, or hide posts that violate these
        terms or that we reasonably believe are harmful to the community. We
        don't pre-screen most content; you are responsible for what you post.
      </p>

      <h2>5. Political neutrality</h2>
      <p>
        Democracy Unlocked is nonpartisan by design. We don't endorse candidates,
        parties, or political positions. Our AI summaries are written under
        explicit instructions to be balanced and present multiple perspectives.
        If you believe a summary is biased, please flag it via the in-app report
        function — we review every report.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        The site is provided "as is" without warranties of any kind, express or
        implied. We do not guarantee that:
      </p>
      <ul>
        <li>Bill summaries or AI analysis are free of error.</li>
        <li>The site will be available without interruption.</li>
        <li>Data from third-party sources is current to the minute.</li>
      </ul>
      <p>
        For binding legal or political action, always consult the original
        legislative text on Congress.gov and qualified legal counsel.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Democracy Unlocked and its
        operators are not liable for indirect, incidental, consequential, or
        punitive damages arising from your use of the site. Our total aggregate
        liability for any claim is limited to USD $100 (the site is free; this
        limit reflects the absence of monetary consideration).
      </p>
      <p>
        Some jurisdictions don't allow limitations on certain damages — in those
        places, the limits above apply only to the extent permitted.
      </p>

      <h2>8. Changes to the service or these terms</h2>
      <p>
        We may add, remove, or change features at any time. We may also revise
        these terms — material changes will be announced in-app or by email.
        Continued use after a change means you accept it. If you don't agree,
        you can delete your account at any time via your{' '}
        <Link href="/account/privacy">Privacy Controls</Link>.
      </p>

      <h2>9. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of the State of Delaware, United
        States, without regard to its conflict-of-laws rules. Any dispute will
        be resolved exclusively in the state or federal courts of Delaware,
        except where applicable law gives you the right to bring claims in your
        local jurisdiction (e.g. EU consumer protection law).
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href="mailto:legal@democracyunlocked.com">legal@democracyunlocked.com</a>.
      </p>
    </article>
  )
}
