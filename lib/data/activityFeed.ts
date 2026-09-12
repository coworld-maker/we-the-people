/**
 * Wording for the dashboard activity feed's community items.
 *
 * Privacy rule: nobody sees anyone else's vote. The About page promises votes
 * are anonymous and individual voting records are never shared, so other
 * people's activity is only ever a per-bill total — these helpers take a count
 * and a bill code, never a name or a position. The signed-in user's own items
 * are worded in GamificationService.getActivityFeed ("You voted yes on …").
 *
 * The feed renders `user` in bold before `text`: "**4 people** have voted on HR 9055".
 */

export function communityVotesItem(people: number, billCode: string): { user: string; text: string } {
  return people === 1
    ? { user: '1 person', text: `has voted on ${billCode}` }
    : { user: `${people} people`, text: `have voted on ${billCode}` }
}

export function communityCommentsItem(comments: number, billCode: string): { user: string; text: string } {
  return comments === 1
    ? { user: '1 new comment', text: `on ${billCode}` }
    : { user: `${comments} comments`, text: `on ${billCode}` }
}
