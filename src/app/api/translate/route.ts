import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return NextResponse.json({ error: 'Translation service is not configured.' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    const { text, targetLanguage } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    if (!targetLanguage) {
      return NextResponse.json({ error: 'No target language provided' }, { status: 400 })
    }

    const LANGUAGE_MAP: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'fil-PH': 'Filipino / Tagalog',
      'es-ES': 'Spanish',
      'ja-JP': 'Japanese'
    }

    const targetLangName = LANGUAGE_MAP[targetLanguage] || targetLanguage

    const prompt = `You are a professional interpreter. Your task is to detect the language of the provided text, and accurately translate it into ${targetLangName}.

STRICT RULES:
- Provide ONLY the translated text.
- Do not add any conversational filler, explanations, or quotes.
- If the text is already in the target language, just fix any obvious grammatical errors or typos and return it.
- Maintain the original tone and formatting as much as possible.

TEXT TO TRANSLATE:
${text}`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    // @ts-ignore
    const translatedText = response.content[0].text?.trim() ?? ''

    return NextResponse.json({ translatedText })
  } catch (err: any) {
    console.error('[translate] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
