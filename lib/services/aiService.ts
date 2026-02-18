import prisma from '@/lib/prisma'
import { BillService } from '@/lib/services/billService'

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
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Claude API HTTP ${response.status}:`, errorText)
    throw new Error(`Claude API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.content || data.content.length === 0) {
    throw new Error('Claude returned empty response')
  }

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

    // Try to fetch full text if we don't have it yet
    let fullText = bill.fullText
    if (!fullText) {
      try {
        fullText = await BillService.fetchAndSaveBillText(billId)
      } catch (e) {
        console.warn('Could not fetch bill text, proceeding without it')
      }
    }

    // Truncate full text to ~6000 chars to stay within token limits
    const truncatedText = fullText
      ? fullText.length > 6000
        ? fullText.substring(0, 6000) + '\n\n[... text truncated for analysis ...]'
        : fullText
      : null

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
${truncatedText ? `\nFull Bill Text:\n${truncatedText}` : ''}
`.trim()

    const systemPrompt = `You are a nonpartisan civic education analyst. Your job is to help everyday Americans understand Congressional legislation in plain, accessible language. Be balanced, factual, and fair. Never take political sides. Always present multiple perspectives.

You MUST respond ONLY with valid JSON. No markdown, no backticks, no commentary before or after the JSON.`

    const prompt = `Analyze this Congressional bill and return a JSON object:

${billContext}

Return ONLY this JSON structure (no other text):
{
  "summary": "A 2-3 paragraph plain-English summary that a high school student could understand. Explain what the bill does, why it matters, and who it affects.",
  "pros": [
    {"title": "Short title", "description": "2-3 sentence explanation", "category": "Economy"}
  ],
  "cons": [
    {"title": "Short title", "description": "2-3 sentence explanation", "category": "Economy"}
  ],
  "impacts": [
    {
      "category": "Economic",
      "demographic": "e.g. Small Business Owners",
      "impactType": "positive",
      "shortDescription": "One sentence",
      "detailedAnalysis": "2-3 sentences",
      "affectedGroups": ["Group 1", "Group 2"],
      "confidence": 75
    }
  ]
}

Valid categories for pros/cons: Economy, Environment, Healthcare, Education, Security, Rights, Infrastructure, Other
Valid categories for impacts: Economic, Social, Environmental, Healthcare, Education, Security, Infrastructure
Valid impactType values: positive, negative, neutral

Provide 3-4 pros, 3-4 cons, and 4-5 impacts covering different demographics. Be balanced.`

    const rawResponse = await callClaude(prompt, systemPrompt)

    let cleaned = rawResponse.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    let analysis: AIAnalysis
    try {
      analysis = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', cleaned.substring(0, 500))
      throw new Error('Failed to parse AI analysis response as JSON')
    }

    if (!analysis.summary || !Array.isArray(analysis.pros) || !Array.isArray(analysis.cons) || !Array.isArray(analysis.impacts)) {
      throw new Error('Invalid AI analysis structure — missing required fields')
    }

    return analysis
  }

  static async analyzeAndSaveBill(billId: string): Promise<void> {
    const analysis = await this.analyzeBill(billId)

    await prisma.bill.update({
      where: { id: billId },
      data: {
        aiSummary: analysis.summary,
        aiAnalyzedAt: new Date(),
      },
    })

    await prisma.proCon.deleteMany({ where: { billId, source: 'ai' } })
    await prisma.impact.deleteMany({ where: { billId } })

    for (const pro of analysis.pros) {
      await prisma.proCon.create({
        data: {
          billId, type: 'pro', title: pro.title,
          description: pro.description, category: pro.category || 'Other', source: 'ai',
        },
      })
    }

    for (const con of analysis.cons) {
      await prisma.proCon.create({
        data: {
          billId, type: 'con', title: con.title,
          description: con.description, category: con.category || 'Other', source: 'ai',
        },
      })
    }

    for (const impact of analysis.impacts) {
      await prisma.impact.create({
        data: {
          billId, category: impact.category || 'Social', demographic: impact.demographic,
          impactType: impact.impactType || 'neutral', shortDescription: impact.shortDescription,
          detailedAnalysis: impact.detailedAnalysis, affectedGroups: impact.affectedGroups || [],
          confidence: impact.confidence || 70,
        },
      })
    }
  }
}
