import prisma from '@/lib/prisma'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface AIAnalysis {
  summary: string
  pros: Array<{ title: string; description: string; category: string }>
  cons: Array<{ title: string; description: string; category: string }>
  impacts: Array<{
    category: string
    demographic: string
    impactType: 'positive' | 'negative' | 'neutral'
    shortDescription: string
    detailedAnalysis: string
    affectedGroups: string[]
    confidence: number
  }>
}

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('')
}

export class AIService {
  static async analyzeBill(billId: string): Promise<AIAnalysis> {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
    })

    if (!bill) throw new Error('Bill not found')

    const billContext = `
Title: ${bill.title}
${bill.shortTitle ? `Short Title: ${bill.shortTitle}` : ''}
Bill: ${bill.billType} ${bill.billNumber} (Congress ${bill.congress})
Status: ${bill.status}
Origin Chamber: ${bill.originChamber}
Policy Area: ${bill.policyArea || 'Not specified'}
Introduced: ${bill.introducedDate.toISOString().split('T')[0]}
Latest Action: ${bill.latestActionText || 'None'}
Official Summary: ${bill.summary || 'No official summary available'}
Subjects: ${bill.subjects?.length ? bill.subjects.join(', ') : 'None listed'}
Sponsors: ${JSON.stringify(bill.sponsors)}
`.trim()

    const systemPrompt = `You are a nonpartisan civic education analyst. Your job is to help everyday Americans understand Congressional legislation in plain, accessible language. Be balanced, factual, and fair. Never take political sides. Always present multiple perspectives.

Respond ONLY with valid JSON — no markdown, no backticks, no extra text.`

    const prompt = `Analyze this Congressional bill and respond with a JSON object containing these fields:

${billContext}

Return this exact JSON structure:
{
  "summary": "A 2-3 paragraph plain-English summary that a high school student could understand. Explain what the bill does, why it matters, and who it affects. Avoid jargon.",
  "pros": [
    {"title": "Short title", "description": "2-3 sentence explanation of this benefit", "category": "Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}
  ],
  "cons": [
    {"title": "Short title", "description": "2-3 sentence explanation of this concern", "category": "Economy|Environment|Healthcare|Education|Security|Rights|Infrastructure|Other"}
  ],
  "impacts": [
    {
      "category": "Economic|Social|Environmental|Healthcare|Education|Security|Infrastructure",
      "demographic": "e.g. Small Business Owners, Rural Communities, Students, etc.",
      "impactType": "positive|negative|neutral",
      "shortDescription": "One sentence impact",
      "detailedAnalysis": "2-3 sentence detailed explanation",
      "affectedGroups": ["Group 1", "Group 2"],
      "confidence": 75
    }
  ]
}

Provide 3-5 pros, 3-5 cons, and 4-6 impacts covering different demographics. Be balanced and fair.`

    const rawResponse = await callClaude(prompt, systemPrompt)

    // Parse JSON, stripping any markdown fences
    const cleaned = rawResponse.replace(/```json\s?|```/g, '').trim()
    const analysis: AIAnalysis = JSON.parse(cleaned)

    // Validate structure
    if (!analysis.summary || !Array.isArray(analysis.pros) || !Array.isArray(analysis.cons) || !Array.isArray(analysis.impacts)) {
      throw new Error('Invalid AI analysis structure')
    }

    return analysis
  }

  static async analyzeAndSaveBill(billId: string): Promise<void> {
    const analysis = await this.analyzeBill(billId)

    // Save AI summary to bill
    await prisma.bill.update({
      where: { id: billId },
      data: {
        aiSummary: analysis.summary,
        aiAnalyzedAt: new Date(),
      },
    })

    // Clear existing AI-generated pros/cons and impacts for this bill
    await prisma.proCon.deleteMany({ where: { billId, source: 'ai' } })
    await prisma.impact.deleteMany({ where: { billId } })

    // Save pros
    for (const pro of analysis.pros) {
      await prisma.proCon.create({
        data: {
          billId,
          type: 'pro',
          title: pro.title,
          description: pro.description,
          category: pro.category,
          source: 'ai',
        },
      })
    }

    // Save cons
    for (const con of analysis.cons) {
      await prisma.proCon.create({
        data: {
          billId,
          type: 'con',
          title: con.title,
          description: con.description,
          category: con.category,
          source: 'ai',
        },
      })
    }

    // Save impacts
    for (const impact of analysis.impacts) {
      await prisma.impact.create({
        data: {
          billId,
          category: impact.category,
          demographic: impact.demographic,
          impactType: impact.impactType,
          shortDescription: impact.shortDescription,
          detailedAnalysis: impact.detailedAnalysis,
          affectedGroups: impact.affectedGroups,
          confidence: impact.confidence,
        },
      })
    }
  }
}
