/**
 * Username validation — shared by the API and the picker UI.
 * Rules: 3–20 chars, letters/numbers/underscore, must start with a letter.
 * Reserved + impersonation-prone names are blocked (officials, staff, admin).
 */

const RESERVED = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'staff', 'official',
  'support', 'help', 'root', 'system', 'democracyunlocked', 'du',
  'congress', 'senate', 'house', 'president', 'senator', 'representative',
  'gov', 'government', 'gop', 'dnc', 'rnc', 'potus', 'whitehouse',
  'anonymous', 'deleted', 'null', 'undefined', 'me', 'you',
])

// Substrings that suggest impersonation of officials/staff
const BLOCKED_SUBSTRINGS = ['official', 'moderator', 'admin', 'senator', 'congress']

export function validateUsername(raw: string): { ok: boolean; reason?: string; value?: string } {
  const value = (raw ?? '').trim()

  if (value.length < 3) return { ok: false, reason: 'Username must be at least 3 characters.' }
  if (value.length > 20) return { ok: false, reason: 'Username must be 20 characters or fewer.' }
  if (!/^[a-zA-Z]/.test(value)) return { ok: false, reason: 'Username must start with a letter.' }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return { ok: false, reason: 'Use only letters, numbers, and underscores.' }
  }

  const lower = value.toLowerCase()
  if (RESERVED.has(lower)) return { ok: false, reason: 'That username is reserved.' }
  for (const s of BLOCKED_SUBSTRINGS) {
    if (lower.includes(s)) return { ok: false, reason: 'That username isn’t allowed — it could imply an official role.' }
  }

  return { ok: true, value }
}
