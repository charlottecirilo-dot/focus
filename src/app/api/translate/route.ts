import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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
      'zh-CN': 'Chinese (Simplified)',
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean'
    }

    const targetLangName = LANGUAGE_MAP[targetLanguage] || targetLanguage

    const prompt = `You are a professional interpreter. Your task is to detect the language of the provided text, and accurately translate it into ${targetLangName}.

STRICT RULES:
- Provide ONLY the translated text.
- Do not add any conversational filler, explanations, or quotes.
- Dictation software might have mistranscribed the words (for instance mistaking foreign words for phonetically similar English words). Be smart and infer the true intended meaning, then translate it to ${targetLangName}.
- If the text is already in the target language or is a mix, convert the entire intent to ${targetLangName} and correct any grammatical errors.
- Maintain the original tone and formatting as much as possible.

TEXT TO TRANSLATE:
${text}`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('API key not configured')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      })
    })

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    translatedText = translatedText.trim()

    return NextResponse.json({ translatedText })
  } catch (err: any) {
    console.error('[translate] Error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
