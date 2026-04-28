import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ translatedText: text || '' })
    }

    if (!targetLanguage) {
      return NextResponse.json({ translatedText: text })
    }

    // Map BCP-47 codes to Google Translate language codes
    const mapping: Record<string, string> = {
      'en-US': 'en',
      'en-GB': 'en',
      'fil-PH': 'tl',
      'zh-CN': 'zh-CN',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'ja-JP': 'ja',
      'ko-KR': 'ko'
    }

    const tgt = mapping[targetLanguage] ?? targetLanguage.split('-')[0]

    // Unofficial Google Translate free endpoint — no API key required
    // sl=auto → Google auto-detects the source language
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tgt)}&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })

    if (!response.ok) {
      console.warn(`Google Translate error: ${response.status}. Falling back to raw text.`)
      return NextResponse.json({ translatedText: text })
    }

    // Response shape: [ [ ["translated", "original", ...], ... ], ... ]
    const data = await response.json()
    const translatedText: string =
      Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])
        ? data[0].map((chunk: any[]) => chunk[0] ?? '').join('')
        : text

    return NextResponse.json({ translatedText })
  } catch (err: any) {
    console.error('[translate] Error:', err)
    // Always return something the frontend can use — never throw a 500
    return NextResponse.json({ translatedText: '' }, { status: 200 })
  }
}
