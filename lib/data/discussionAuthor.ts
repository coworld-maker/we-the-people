/**
 * Public author shape for discussion comments. Discussions are readable by
 * anyone, and usernames exist so people can post political opinions without
 * exposing who they are — so real names never leave the server. Without a
 * username, the fallback is "First L." (never the full last name), then
 * "Citizen".
 */

export interface RawAuthor {
  id: string
  firstName: string | null
  lastName: string | null
  username: string | null
}

export interface PublicAuthor {
  id: string
  username: string | null
  displayName: string
}

export function toPublicAuthor(u: RawAuthor): PublicAuthor {
  const first = u.firstName?.trim()
  const lastInitial = u.lastName?.trim().charAt(0).toUpperCase()
  const displayName = u.username
    ? `@${u.username}`
    : first
      ? (lastInitial ? `${first} ${lastInitial}.` : first)
      : 'Citizen'
  return { id: u.id, username: u.username ?? null, displayName }
}

type Thread = { user: RawAuthor; replies?: Thread[] }
type PublicThread<T> = Omit<T, 'user' | 'replies'> & { user: PublicAuthor; replies?: PublicThread<T>[] }

/** Swap every author in a comment (and its nested replies) for the public shape. */
export function publicThread<T extends Thread>(item: T): PublicThread<T> {
  const { user, replies, ...rest } = item
  return {
    ...rest,
    user: toPublicAuthor(user),
    ...(replies ? { replies: replies.map(r => publicThread(r as T)) } : {}),
  }
}
