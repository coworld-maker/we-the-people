# Security Policy

We take the security of Democracy Unlocked seriously. The platform processes
political opinions and user-generated content, and a compromise could damage
trust in the broader civic-tech ecosystem. If you find something off, please
help us fix it.

## Reporting a vulnerability

**Please do not file a public GitHub issue for a security vulnerability.**

Send an email to **security@democracyunlocked.com** with:

- A description of the vulnerability
- Steps to reproduce (proof-of-concept if possible)
- Your assessment of the potential impact
- (Optional) Suggested mitigation
- (Optional) Whether you want public acknowledgment in the fix

We aim to:

- **Acknowledge** your report within **48 hours**
- **Triage and confirm** within **5 business days**
- **Ship a fix** for high-severity issues within **30 days**

For lower-severity issues we'll communicate a realistic timeline.

## What's in scope

- The production web app at `https://www.democracyunlocked.com` and its API endpoints
- The source code in this repository
- Our use of third-party services (Clerk, Supabase, Vercel, Anthropic)

## What's out of scope

- Findings from automated scanners without a working proof-of-concept
- Social engineering of our team or users
- Physical attacks
- Denial of service or brute-force attacks
- Issues in our third-party dependencies that have not been disclosed to those vendors first (please disclose upstream and let us know)

## Responsible disclosure

We follow [coordinated vulnerability disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure).
Once a fix is deployed, we'll:

- Publish an advisory describing the issue and its resolution
- Credit the reporter (if they want credit) in the advisory and in the commit message
- Add the fix to our [DEVLOG](./docs/DEVLOG.md)

We do not currently offer monetary rewards (we're a small, free, open-source
project) — but we deeply appreciate the work of security researchers and will
gladly write public thank-yous, recommendation letters, and detailed
LinkedIn endorsements for serious findings.

## Known sensitive areas

If you're doing exploratory security work, these are the areas where issues
would have the most impact:

- **Authentication / session handling** — `app/api/account/*`, Clerk integration
- **Privacy data flows** — `app/api/account/export`, `app/api/account/delete`
- **Encryption at rest** — `User.emailEncrypted`, `User.zipCodeEncrypted`,
  `Vote.reasoningEncrypted`, `AuditLog.ipAddressHash`
- **Sync endpoints** — `app/api/sync-*`, `app/api/cron/*` (CRON_SECRET-gated)
- **AI prompt injection** — `lib/services/aiService.ts`, especially anywhere
  user content could reach a Claude system prompt

## Hall of fame

Security researchers who have helped improve this project:

_(empty for now — be the first!)_
