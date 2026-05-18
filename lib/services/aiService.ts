import prisma from '@/lib/prisma'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

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

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set')

  console.log('Calling Claude API...')

  const body = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 3000,
    system: systemPrompt,
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

    const systemPrompt = `You are a nonpartisan civic education analyst helping Americans understand legislation. Be balanced, factual, fair. Never take sides. Respond ONLY with valid JSON — no markdown, no backticks, no text outside the JSON.`

    const prompt = `Analyze this bill. Return ONLY valid JSON:

${billContext}

JSON structure:
{"summary":"2-3 paragraph plain-English summary a high schooler could understand","pros":[{"title":"Short title","description":"2-3 sentences","category":"Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}],"cons":[{"title":"Short title","description":"2-3 sentences","category":"Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}],"impacts":[{"category":"Economic|Social|Environmental|Healthcare|Education|Security|Infrastructure","demographic":"e.g. Small Business Owners","impactType":"positive|negative|neutral","shortDescription":"One sentence","detailedAnalysis":"2-3 sentences","affectedGroups":["Group1"],"confidence":75}]}

Provide 3-4 pros, 3-4 cons, 4-5 impacts. Be balanced.`

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

    if (!analysis.summary || !Array.isArray(analysis.pros) || !Array.isArray(analysis.cons)) {
      throw new Error('AI response missing required fields')
    }

    return analysis
  }

  static async analyzeAndSaveBill(billId: string): Promise<void> {
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
      data: { stateImpacts: out, stateImpactsAt: new Date() },
    })

    return out
  }
}
