import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Democracy Unlocked collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'May 24, 2026'
const EFFECTIVE = 'May 24, 2026'

export default function PrivacyPolicyPage() {
  return (
    <article className="prose-legal">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[--text-muted] hover:text-[--accent] font-medium mb-6 transition-colors no-underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Back home
      </Link>

      <h1>Privacy Policy</h1>
      <p className="text-sm text-[--text-muted]">
        Effective: {EFFECTIVE} · Last updated: {LAST_UPDATED}
      </p>

      <p className="lead">
        Democracy Unlocked ("we," "us," "our") provides a free, nonpartisan platform
        for citizens to read, vote on, and discuss U.S. Congressional legislation.
        This Privacy Policy explains what personal information we collect, why we
        collect it, how we use and share it, and the rights you have over it. By
        using our site you agree to the practices described below. Where the law
        gives you stronger rights — under the EU General Data Protection Regulation,
        the California Consumer Privacy Act (CCPA/CPRA), or any other applicable
        statute — those rights apply in full.
      </p>

      <h2>1. Information we collect</h2>

      <h3>1.1 Information you give us directly</h3>
      <ul>
        <li>
          <strong>Account information.</strong> When you sign up we collect your
          email address, a hashed password (or an OAuth token if you sign in with
          a third-party provider), and your name. Authentication is handled by
          Clerk — your password is never stored on our servers in plaintext.
        </li>
        <li>
          <strong>Optional profile data.</strong> Your home state, ZIP code (stored
          encrypted), and policy interests, if you choose to provide them.
        </li>
        <li>
          <strong>Civic engagement data.</strong> Your votes on bills, your
          comments in discussions, the bills you track, and any feedback you
          submit. Because votes on legislation can reveal political opinions,
          we treat them as a <em>special category</em> of personal data under
          GDPR Article 9 and process them only with your explicit consent (which
          you give by casting a vote).
        </li>
      </ul>

      <h3>1.2 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Usage data.</strong> Pages visited, features used, approximate
          session duration. We do not use third-party analytics that profile
          individual users across sites.
        </li>
        <li>
          <strong>Device and connection data.</strong> IP address (used only to
          derive approximate region and prevent abuse — not stored long-term in
          identifiable form), browser type, and operating system.
        </li>
        <li>
          <strong>Cookies and similar technologies.</strong> See "Cookies" below.
        </li>
      </ul>

      <h3>1.3 Information from third parties</h3>
      <ul>
        <li>
          <strong>Public legislative data.</strong> Bills, sponsors, roll-call votes,
          representative profiles — all sourced from public APIs (Congress.gov,
          OpenStates). This information is about elected officials and legislation,
          not about you.
        </li>
        <li>
          <strong>Authentication providers.</strong> If you sign in via a third
          party (e.g. Google), that provider shares the minimum profile fields
          needed to create your account.
        </li>
      </ul>

      <h2>2. Why we use your information (legal bases under GDPR)</h2>

      <p>
        Where GDPR applies, our lawful bases for processing your personal data are:
      </p>
      <ul>
        <li>
          <strong>Contract.</strong> To provide the service you signed up for —
          authenticating you, saving your votes, displaying your dashboard.
        </li>
        <li>
          <strong>Legitimate interests.</strong> To operate, secure, and improve
          the platform; prevent fraud and abuse; analyze aggregate (non-identified)
          usage to make product decisions.
        </li>
        <li>
          <strong>Explicit consent.</strong> For processing your votes, comments,
          and inferred political opinions (special-category data); for sending
          email notifications; for any cookies beyond strictly necessary ones.
          You can withdraw consent at any time.
        </li>
        <li>
          <strong>Legal obligation.</strong> To respond to lawful subpoenas, court
          orders, and statutory requests.
        </li>
      </ul>

      <h2>3. How we share information</h2>

      <p>
        We do not sell your personal information. We do not share it with
        advertisers, data brokers, or political campaigns. The only third parties
        that receive your information are the service providers we use to run
        the site, each under a contract that limits what they can do with it:
      </p>
      <ul>
        <li><strong>Clerk</strong> — authentication and session management.</li>
        <li><strong>Supabase</strong> — encrypted PostgreSQL database hosting.</li>
        <li><strong>Vercel</strong> — application hosting and edge networking.</li>
        <li><strong>Anthropic</strong> — AI bill summaries and analysis. Bill text and metadata are sent for analysis; your personal account data is not.</li>
        <li><strong>Resend</strong> (or similar email provider) — transactional email if you have notifications enabled.</li>
      </ul>
      <p>
        We may also disclose information when required by law, to protect the
        safety of users or the public, or in connection with a merger or
        acquisition (we'll notify you and honor existing privacy commitments).
      </p>

      <h2>4. Cookies and tracking</h2>

      <p>
        We use a minimal set of cookies, organized into two categories:
      </p>
      <ul>
        <li>
          <strong>Strictly necessary.</strong> Authentication, CSRF protection, and
          your privacy preferences. These cannot be turned off — without them
          the site doesn't work.
        </li>
        <li>
          <strong>Functional.</strong> Remembering your selected state, your
          interests, and your reading position. Loaded only with consent.
        </li>
      </ul>
      <p>
        We do <strong>not</strong> use advertising cookies, third-party trackers,
        or cross-site tracking. The cookie banner appears on your first visit and
        any time you change devices or browsers.
      </p>

      <h2>5. Your rights</h2>

      <h3>5.1 Rights everyone has</h3>
      <ul>
        <li><strong>Access</strong> — request a copy of the data we hold about you.</li>
        <li><strong>Correction</strong> — fix data that's wrong or out of date.</li>
        <li><strong>Deletion</strong> — permanently delete your account and personal data.</li>
        <li><strong>Portability</strong> — get your data in a machine-readable format (JSON).</li>
      </ul>
      <p>
        Exercise any of these via your <Link href="/account/privacy">Privacy Controls</Link> page or by emailing <a href="mailto:privacy@democracyunlocked.com">privacy@democracyunlocked.com</a>. We respond within 30 days.
      </p>

      <h3>5.2 Additional rights for residents of the EU/EEA, UK, and Switzerland (GDPR / UK GDPR)</h3>
      <ul>
        <li>Object to processing based on legitimate interests.</li>
        <li>Restrict processing while we resolve a dispute.</li>
        <li>Withdraw consent at any time, without affecting the lawfulness of prior processing.</li>
        <li>Lodge a complaint with your local data protection authority.</li>
        <li>
          Where we transfer data outside the EEA (e.g. to US-based service providers),
          we rely on Standard Contractual Clauses or equivalent safeguards.
        </li>
      </ul>

      <h3>5.3 Additional rights for California residents (CCPA / CPRA)</h3>
      <ul>
        <li>
          Know the categories of personal information collected, sources, business
          purposes, and third parties shared with — all listed above.
        </li>
        <li>
          Opt out of "sale" or "sharing" of personal information.
          <strong> We do not sell or share your information in the CCPA sense.</strong>
        </li>
        <li>
          Limit the use of sensitive personal information. We treat your political
          opinions and precise geolocation (when collected) as sensitive.
        </li>
        <li>Non-discrimination — exercising your rights won't degrade your service.</li>
      </ul>

      <h3>5.4 Other US state laws</h3>
      <p>
        Residents of Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah
        (UCPA), Texas (TDPSA), Oregon (OCPA), Montana (MTCDPA), and Delaware (DPDPA)
        have rights substantially similar to those listed above and can exercise
        them through the same channels.
      </p>

      <h2>6. Data retention</h2>

      <p>
        We keep your account data for as long as your account is active. When
        you delete your account, we permanently remove your personal information
        within 30 days. Anonymized aggregate data (e.g. "67% of California voted
        yes on HR 123") is retained indefinitely for civic transparency, since
        it can no longer be linked back to you.
      </p>
      <p>
        Audit logs of sensitive account actions (login, password change, data
        export, account deletion) are retained for 12 months for security
        purposes, then deleted automatically.
      </p>

      <h2>7. Security</h2>

      <p>
        We protect your data with:
      </p>
      <ul>
        <li>Encryption in transit (TLS) and at rest (database-level).</li>
        <li>Application-level encryption for the most sensitive fields (your email and ZIP code are encrypted with keys we control).</li>
        <li>Single sign-on via Clerk — passwords are never stored in our database.</li>
        <li>Limited access to production systems; audit logs of every privileged action.</li>
        <li>Automated dependency scanning and routine security updates.</li>
      </ul>
      <p>
        No system is perfectly secure. If we ever detect a breach affecting your
        personal data, we'll notify you and the relevant authorities within the
        timeframes the law requires (72 hours under GDPR for a high-risk breach).
      </p>

      <h2>8. Children's privacy</h2>

      <p>
        The site is not intended for children under 13 (under 16 in the EU/EEA).
        We don't knowingly collect personal information from children. If you
        believe a child has registered, please contact us and we'll delete the
        account.
      </p>

      <h2>9. International users</h2>

      <p>
        Democracy Unlocked is operated from the United States. If you access the
        site from outside the US, you understand that your data will be
        transferred to and processed in the US. We use Standard Contractual
        Clauses (SCCs) and equivalent safeguards for any transfer of EU/UK
        personal data, and we limit such transfers to what's strictly necessary
        to provide the service.
      </p>

      <h2>10. Changes to this policy</h2>

      <p>
        We'll post any updates here and update the "Last updated" date above. If
        the changes are material, we'll notify active users by email. Continued
        use of the site after a change means you accept the revised policy.
      </p>

      <h2>11. Contact us</h2>

      <p>
        Questions, requests, or concerns about your privacy?
      </p>
      <ul>
        <li>Email: <a href="mailto:privacy@democracyunlocked.com">privacy@democracyunlocked.com</a></li>
        <li>Postal: Democracy Unlocked, Privacy Office, [address — fill in before launch]</li>
        <li>EU/UK representative: [appoint before EU launch under GDPR Art. 27]</li>
      </ul>
    </article>
  )
}
