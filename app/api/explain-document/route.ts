import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sectionTitle, documentTitle, text, isSelection } = await request.json()

    if (!text || text.length < 5) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const systemPrompt = `You are a constitutional scholar and educator helping everyday Americans understand the founding documents of the United States. Your goal is to make complex 18th-century legal language accessible and interesting.

Guidelines:
- Use clear, modern language that a high school student could understand
- Explain historical context — why was this written this way?
- Note any landmark Supreme Court cases or modern implications when relevant
- Be balanced and nonpartisan in your analysis
- Keep explanations concise but thorough (2-4 short paragraphs)
- Use concrete examples to illustrate abstract principles
- If there are ongoing debates about interpretation, briefly acknowledge both perspectives`

    let userPrompt: string

    if (isSelection) {
      userPrompt = `A user is reading the ${documentTitle}, specifically the section titled "${sectionTitle}". They highlighted this particular passage and want to understand it better:

"${text}"

Explain what this passage means in plain English. Include:
1. What it literally says in modern language
2. Why the founders included this specific language
3. How this has been applied or interpreted in practice`
    } else {
      userPrompt = `Provide an analysis of this section from the ${documentTitle}:

Section: ${sectionTitle}

Text: "${text.substring(0, 2000)}"

Provide:
1. A brief overview of what this section establishes
2. The historical context — what problem were the founders trying to solve?
3. Key phrases or concepts that are especially important
4. How this section remains relevant today`
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
    }

    const data = await res.json()

    const explanation = data.content
      ?.filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('\n') || 'Unable to generate explanation.'

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Document explanation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
