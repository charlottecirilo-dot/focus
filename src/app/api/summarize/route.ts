import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const prompt = `You are an expert educational assistant. Summarize the following source material into structured study sections.
    
The response must be EXCLUSIVELY a JSON array of objects. Each object represents a section and must have:
1. "heading": A concise title for the section (e.g. "Core Concepts", "Actionable Insights", etc.)
2. "bullets": An array of 3-5 strings representing the key points for that section.

Return ONLY the raw JSON array. Do not include markdown code fences or conversational text.

Source Material:
${text.substring(0, 3000)}`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('API key not configured')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          maxOutputTokens: 500
        }
      })
    })

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    
    // Clean potential markdown ticks
    resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    if (!resultText) resultText = "[]"

    const summary = JSON.parse(resultText)

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Summarization AI error:', error)
    return NextResponse.json({ error: "AI generation failed, please try again" }, { status: 500 })
  }
}
