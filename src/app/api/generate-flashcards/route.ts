import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: 'You are a flashcard-generating AI. Always return ONLY a valid JSON array with no extra text, no markdown, no code fences. Each item must have exactly two fields: "front" for the question or concept, and "back" for the concise answer. Base every entry strictly on the text provided.',
      messages: [
        {
          role: 'user',
          content: `Generate 5 to 10 high-quality flashcards from the following text:\n\n${text.substring(0, 3000)}`
        }
      ]
    })

    let resultText = (message.content[0] as any).text || '[]'

    // Strip any accidental markdown fences
    resultText = resultText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
    if (!resultText) resultText = '[]'

    let flashcards: any[]
    try {
      flashcards = JSON.parse(resultText)
    } catch (parseErr) {
      console.error('[Claude] JSON parse failed. Raw text:', resultText)
      return NextResponse.json({ error: 'AI returned invalid data. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ flashcards })
  } catch (error: any) {
    console.error('[Claude] Flashcard generation error:', error.message)
    return NextResponse.json({ error: error.message || 'AI generation failed, please try again' }, { status: 500 })
  }
}
