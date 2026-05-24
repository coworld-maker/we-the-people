import prisma from '@/lib/prisma'
import { POLICY_AREAS, isValidPolicyArea, type PolicyArea } from '@/lib/data/policy-areas'
import { getStateImpactsForPolicyArea } from '@/lib/data/state-impact-weights'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * Currently-pinned Claude model.
 *
 * ⚠️ Anthropic retires snapshot model IDs (~6 months notice). When this stops
 * working you'll see a 404 not_found_error from the API — the catch in
 * callClaude() detects that and surfaces a clear error message naming
 * THIS constant as the thing to update.
 *
 * Check status anytime with:  npm run check:model
 * Deprecation schedule:        https://platform.claude.com/docs/en/about-claude/model-deprecations
 * Current models list:         https://platform.claude.com/docs/en/about-claude/models/overview
 */
export const CLAUDE_MODEL = 'claude-haiku-4-5'

// Skip AI regen when an analysis is fresher than this AND the bill's status
// hasn't changed since (status change is what actually matters substantively).
const ANALYSIS_STALENESS_DAYS = 30

interface AIAnalysis {
  summary: string
  pros: Array<{ title: string; description: string; category: string }>
  cons: Array<{ title: string; description: string; category: string }>
  impacts: Array<{
    category: string; demographic: string; impactType: string
    shortDescription: string; detailedAnalysis: string
    affectedGroups: string[]; confidence: number
  }>
}

/**
 * Call Claude. When `cacheSystemPrompt` is true (default for our stable
 * system prompts) we send the system block with `cache_control` so that
 * repeated calls within the 5-minute cache window are charged at 10% of
 * the system-prompt input tokens. Big win when the same prompt analyzes
 * many bills in a row.
 */
async function callClaude(prompt: string, systemPrompt: string, cacheSystemPrompt = true): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set')

  const body: any = {
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    system: cacheSystemPrompt
      ? [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }]
      : systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Claude API ${response.status}:`, errorText)
    // Specifically detect a retired-model 404 and surface an actionable hint
    // pointing at the single line that needs updating.
    if (response.status === 404 && /model.*not_found_error|model:\s*['"]?[\w.-]+['"]?/i.test(errorText)) {
      throw new Error(
        `Claude model "${CLAUDE_MODEL}" appears to be retired. ` +
        `Update CLAUDE_MODEL in lib/services/aiService.ts to a current model from ` +
        `https://platform.claude.com/docs/en/about-claude/models/overview — ` +
        `you can also run \`npm run check:model\` to see the current status.`,
      )
    }
    throw new Error(`Claude API returned ${response.status}: ${errorText.substring(0, 200)}`)
  }

  const data = await response.json()
  console.log('Claude API responded, content blocks:', data.content?.length)

  if (!data.content || data.content.length === 0) {
    throw new Error('Claude returned empty response')
  }

  return data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
}

export class AIService {
  static async analyzeBill(billId: string): Promise<AIAnalysis> {
    const bill = await prisma.bill.findUnique({ where: { id: billId } })
    if (!bill) throw new Error('Bill not found')

    // Try to get full text (non-blocking)
    let fullText: string | null = bill.fullText
    if (!fullText) {
      try {
        const { BillService } = await import('@/lib/services/billService')
        fullText = await BillService.fetchAndSaveBillText(billId)
      } catch (e) {
        console.warn('Could not fetch bill text, proceeding without it')
      }
    }

    const truncatedText = fullText && fullText.length > 6000
      ? fullText.substring(0, 6000) + '\n[... truncated ...]'
      : fullText

    const billContext = [
      `Title: ${bill.title}`,
      bill.shortTitle ? `Short Title: ${bill.shortTitle}` : '',
      `Bill: ${bill.billType} ${bill.billNumber} (Congress ${bill.congress})`,
      `Status: ${bill.status}`,
      `Origin: ${bill.originChamber}`,
      `Policy Area: ${bill.policyArea || 'Not specified'}`,
      `Introduced: ${bill.introducedDate.toISOString().split('T')[0]}`,
      `Latest Action: ${bill.latestActionText || 'None'}`,
      `Summary: ${bill.summary || 'No official summary'}`,
      `Subjects: ${bill.subjects?.length ? bill.subjects.join(', ') : 'None'}`,
      truncatedText ? `\nFull Bill Text:\n${truncatedText}` : '',
    ].filter(Boolean).join('\n')

    // If CRS already provides a meaningful summary, skip the AI summary pass.
    // Saves ~30% of output tokens per analysis with no quality loss — the CRS
    // summary is the authoritative one anyway.
    const hasCrsSummary = !!(bill.summary && bill.summary.length > 200)

    const systemPrompt = `You are a nonpartisan civic education analyst helping Americans understand legislation. Be balanced, factual, fair. Never take sides. Respond ONLY with valid JSON — no markdown, no backticks, no text outside the JSON.`

    const summaryField = hasCrsSummary ? '' : '"summary":"2-3 paragraph plain-English summary a high schooler could understand",'
    const summaryInstruction = hasCrsSummary
      ? 'Skip the summary field entirely — the bill already has an official summary.'
      : 'Include a 2-3 paragraph plain-English summary.'

    const prompt = `Analyze this bill. Return ONLY valid JSON:

${billContext}

JSON structure:
{${summaryField}"pros":[{"title":"Short title","description":"2-3 sentences","category":"Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}],"cons":[{"title":"Short title","description":"2-3 sentences","category":"Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}],"impacts":[{"category":"Economic|Social|Environmental|Healthcare|Education|Security|Infrastructure","demographic":"e.g. Small Business Owners","impactType":"positive|negative|neutral","shortDescription":"One sentence","detailedAnalysis":"2-3 sentences","affectedGroups":["Group1"],"confidence":75}]}

${summaryInstruction} Provide 3-4 pros, 3-4 cons, 4-5 impacts. Be balanced.`

    const raw = await callClaude(prompt, systemPrompt)

    let cleaned = raw.trim()
    // Strip markdown code fences
    cleaned = cleaned.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '')

    let analysis: AIAnalysis
    try {
      analysis = JSON.parse(cleaned)
    } catch (e) {
      console.error('JSON parse failed. First 500 chars:', cleaned.substring(0, 500))
      throw new Error('AI response was not valid JSON')
    }

    if (!Array.isArray(analysis.pros) || !Array.isArray(analysis.cons)) {
      throw new Error('AI response missing required fields')
    }
    // If we instructed the model to skip the summary, fall back to the CRS one
    if (!analysis.summary) {
      analysis.summary = bill.summary || ''
    }

    return analysis
  }

  /**
   * Analyze + persist. Skips regeneration when:
   *   - aiAnalyzedAt is within ANALYSIS_STALENESS_DAYS, AND
   *   - bill.status hasn't changed since last analysis
   * Status change is the substantive trigger — same bill in the same status
   * isn't worth re-analyzing.
   *
   * Pass `force: true` to bypass the freshness check.
   */
  static async analyzeAndSaveBill(billId: string, opts: { force?: boolean } = {}): Promise<void> {
    if (!opts.force) {
      const existing = await prisma.bill.findUnique({
        where: { id: billId },
        select: { aiAnalyzedAt: true, status: true, updatedAt: true },
      })
      if (existing?.aiAnalyzedAt) {
        const ageMs = Date.now() - new Date(existing.aiAnalyzedAt).getTime()
        const fresh = ageMs < ANALYSIS_STALENESS_DAYS * 24 * 3600 * 1000
        // Heuristic: if the bill row hasn't been touched since the analysis,
        // status definitely hasn't changed — skip outright.
        const statusUnchanged = new Date(existing.updatedAt).getTime() <= new Date(existing.aiAnalyzedAt).getTime()
        if (fresh && statusUnchanged) {
          console.log(`Skipping analysis for ${billId} — fresh + status unchanged`)
          return
        }
      }
    }

    const analysis = await this.analyzeBill(billId)

    await prisma.bill.update({
      where: { id: billId },
      data: { aiSummary: analysis.summary, aiAnalyzedAt: new Date() },
    })

    // Clear old AI data
    await prisma.proCon.deleteMany({ where: { billId, source: 'ai' } })
    await prisma.impact.deleteMany({ where: { billId } })

    // Save pros & cons
    for (const item of [...analysis.pros.map(p => ({ ...p, type: 'pro' })), ...analysis.cons.map(c => ({ ...c, type: 'con' }))]) {
      await prisma.proCon.create({
        data: { billId, type: item.type, title: item.title, description: item.description, category: item.category || 'Other', source: 'ai' },
      })
    }

    // Save impacts
    for (const impact of (analysis.impacts || [])) {
      await prisma.impact.create({
        data: {
          billId, category: impact.category || 'Social', demographic: impact.demographic,
          impactType: impact.impactType || 'neutral', shortDescription: impact.shortDescription,
          detailedAnalysis: impact.detailedAnalysis, affectedGroups: impact.affectedGroups || [],
          confidence: impact.confidence || 70,
        },
      })
    }

    console.log(`✓ Saved analysis for bill ${billId}: ${analysis.pros.length} pros, ${analysis.cons.length} cons, ${analysis.impacts?.length || 0} impacts`)
  }

  /**
   * Classify a bill into one of the standard CRS policy areas based on its
   * title, summary, and subjects. Returns the picked policy area, or null
   * if the model declined (e.g. truly ambiguous bill).
   */
  static async categorizeBill(billId: string): Promise<PolicyArea | null> {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: { title: true, shortTitle: true, summary: true, subjects: true, billType: true, billNumber: true },
    })
    if (!bill) throw new Error('Bill not found')

    const description = [
      bill.shortTitle && bill.shortTitle !== bill.title ? `Short title: ${bill.shortTitle}` : null,
      bill.summary,
      bill.subjects.length > 0 ? `Subjects: ${bill.subjects.join(', ')}` : null,
    ].filter(Boolean).join('\n\n')

    const systemPrompt = `You categorize U.S. federal bills into a single Congressional Research Service (CRS) policy area. You MUST choose exactly one label from this fixed list:

${POLICY_AREAS.map(a => `- ${a}`).join('\n')}

Respond with ONLY the exact label and nothing else — no quotes, no punctuation, no explanation. If a bill genuinely spans multiple areas, pick the dominant one. If a bill is truly impossible to categorize, respond with exactly: NONE`

    const userPrompt = `Bill: ${bill.billType} ${bill.billNumber} — ${bill.title}\n\n${description || '(no description)'}`

    const raw = (await callClaude(userPrompt, systemPrompt)).trim()
    if (raw === 'NONE') return null
    if (!isValidPolicyArea(raw)) {
      // Try a loose match — Claude occasionally adds trailing punctuation
      const cleaned = raw.replace(/[."']+$/, '').trim()
      if (!isValidPolicyArea(cleaned)) {
        console.warn(`Categorizer returned unknown label "${raw}" for bill ${billId}`)
        return null
      }
      await prisma.bill.update({ where: { id: billId }, data: { policyArea: cleaned } })
      return cleaned
    }

    await prisma.bill.update({ where: { id: billId }, data: { policyArea: raw } })
    return raw
  }

  /**
   * Generate per-state impact scores for a bill. Returns a map of
   * 2-letter state code → { score: 0-1, reason: short string }.
   * Score interpretation:
   *   0.7+  high impact (state is heavily affected)
   *   0.4–0.7 moderate impact
   *   0.0–0.4 low/baseline impact
   */
  static async analyzeStateImpact(billId: string): Promise<Record<string, { score: number; reason: string }>> {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      select: {
        title: true, shortTitle: true, summary: true, aiSummary: true,
        policyArea: true, subjects: true, billType: true, billNumber: true,
      },
    })
    if (!bill) throw new Error('Bill not found')

    // ── Fast path: deterministic weights when we have data for the policyArea
    //    Zero AI cost, instant response, fully explainable.
    const deterministic = getStateImpactsForPolicyArea(bill.policyArea)
    if (deterministic) {
      await prisma.bill.update({
        where: { id: billId },
        data: { stateImpacts: deterministic as any, stateImpactsAt: new Date() },
      })
      console.log(`✓ State-impact (deterministic) saved for ${billId} — policyArea: ${bill.policyArea}`)
      return deterministic
    }

    // ── Slow path: AI fallback for uncovered policy areas
    const description = [
      bill.aiSummary,
      bill.summary,
      bill.policyArea && `Policy area: ${bill.policyArea}`,
      bill.subjects.length > 0 && `Subjects: ${bill.subjects.join(', ')}`,
    ].filter(Boolean).join('\n\n')

    const systemPrompt = `You are a nonpartisan policy analyst. Estimate how much each U.S. state would be affected by a federal bill, considering: industries concentrated in the state, demographic makeup, geography (coastal, agricultural, urban), and historical engagement with the policy area. Be objective — do not infer political support, only material impact.

Return ONLY valid JSON, no prose. Schema:
{ "impacts": [ { "state": "CA", "score": 0.85, "reason": "Largest agricultural producer; bill directly affects subsidies" }, ... ] }

Include all 50 states + DC. Score is 0.0 to 1.0. Keep reasons under 90 characters. Use 0.3 as the "no special impact" baseline.`

    const userPrompt = `Bill: ${bill.billType} ${bill.billNumber} — ${bill.shortTitle || bill.title}\n\n${description || 'No description available.'}`

    const raw = await callClaude(userPrompt, systemPrompt)

    // Strip code fences if present
    const jsonStr = raw.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim()
    const parsed = JSON.parse(jsonStr) as { impacts: Array<{ state: string; score: number; reason: string }> }

    const out: Record<string, { score: number; reason: string }> = {}
    for (const item of parsed.impacts || []) {
      const code = item.state.toUpperCase().trim()
      if (!/^[A-Z]{2}$/.test(code)) continue
      const score = Math.max(0, Math.min(1, Number(item.score) || 0))
      out[code] = { score, reason: (item.reason || '').slice(0, 120) }
    }

    await prisma.bill.update({
      where: { id: billId },
      data: { stateImpacts: out as any, stateImpactsAt: new Date() },
    })

    return out
  }

  /**
   * Generate a short (2-paragraph) plain-English digest of what's happening
   * legislatively for citizens in a given state. Synthesizes top bills, top
   * policy areas, and recent rep activity into a nonpartisan paragraph.
   *
   * Pass pre-computed aggregates so the caller (the state-page API) controls
   * the query and we don't double-fetch.
   */
  static async generateStateDigest(input: {
    stateCode: string
    stateName: string
    topPolicyAreas: Array<{ area: string; count: number }>
    topBills: Array<{ title: string; shortTitle: string | null; status: string; policyArea: string | null }>
    repActivitySummary: string  // pre-formatted by the caller
  }): Promise<string> {
    const { stateCode, stateName, topPolicyAreas, topBills, repActivitySummary } = input

    const billsLine = topBills.length === 0
      ? 'No recent citizen-vote activity yet.'
      : topBills.slice(0, 5).map(b =>
          `  - ${b.shortTitle || b.title} (${b.policyArea || 'uncategorized'}, status: ${b.status})`
        ).join('\n')

    const areasLine = topPolicyAreas.length === 0
      ? 'No clear focus areas yet.'
      : topPolicyAreas.slice(0, 5).map(a => `  - ${a.area}: ${a.count} votes`).join('\n')

    const systemPrompt =
      'You are a nonpartisan civic education writer. Write a 2-paragraph plain-English ' +
      'digest of what citizens in a US state are paying attention to legislatively. ' +
      'Stay neutral — do not take sides, do not endorse positions, do not characterize ' +
      'one party as better than another. Focus on what bills, topics, and actions are ' +
      'drawing engagement. Reference specific bills/areas from the data provided when ' +
      'natural. Total length: 100-180 words. Respond with plain text, no markdown headers.'

    const userPrompt = `State: ${stateName} (${stateCode})

Top policy areas by citizen-vote count:
${areasLine}

Most-voted bills:
${billsLine}

Recent rep activity:
${repActivitySummary || '(none recorded)'}`

    return await callClaude(userPrompt, systemPrompt)
  }
}
