import { NextRequest, NextResponse } from 'next/server'

/**
 * Local extractive summarizer — no external API calls.
 * Uses TF-IDF-style sentence scoring to pick the most important sentences
 * from the input, then groups them into structured sections.
 */

// Common English stop words to ignore when scoring
const STOP_WORDS = new Set([
  'a','an','the','and','but','or','for','nor','so','yet','at','by','for',
  'in','of','on','to','up','as','is','it','its','be','was','are','were',
  'has','had','have','do','does','did','will','would','shall','should',
  'may','might','can','could','this','that','these','those','i','you',
  'he','she','we','they','me','him','her','us','them','my','your','his',
  'our','their','what','which','who','with','from','about','into','through',
  'during','before','after','above','below','between','each','then','than',
  'also','just','been','being','not','no','if','how','all','both','any',
  'such','same','very','too','more','most','other','some','only','own',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
}

function scoreSentences(sentences: string[]): number[] {
  // Build word frequency across the entire document
  const wordFreq: Record<string, number> = {}
  for (const sent of sentences) {
    for (const word of tokenize(sent)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  }

  // Score each sentence by sum of word frequencies
  return sentences.map(sent => {
    const words = tokenize(sent)
    if (words.length === 0) return 0
    const score = words.reduce((sum, w) => sum + (wordFreq[w] || 0), 0)
    
    // Heuristics:
    // - Prefer sentences that end with periods over fragments
    // - Prefer medium length (10-30 tokens)
    // - Bonus for sentences starting with capital letters
    const lengthPenalty = words.length < 8 ? 0.4 : words.length > 50 ? 0.6 : 1.0
    const punctuationBonus = sent.match(/[.?!]$/) ? 1.2 : 0.8
    const capitalizationBonus = /^[A-Z]/.test(sent) ? 1.1 : 1.0
    
    return (score / words.length) * lengthPenalty * punctuationBonus * capitalizationBonus
  })
}

function extractSections(text: string): Array<{ heading: string; bullets: string[] }> {
  const rawSections: Array<{ heading: string; bullets: string[] }> = []

  // Try to detect explicit headings (short lines, possibly ALL CAPS or title case)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const headingLines: number[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isHeading =
      (line === line.toUpperCase() && line.length > 3 && line.length < 80) ||
      (line.length < 60 && !line.includes('.') && i < lines.length - 1 && lines[i + 1].length > 20)
    if (isHeading) headingLines.push(i)
  }

  if (headingLines.length >= 2) {
    // Build sections from document structure
    for (let h = 0; h < headingLines.length; h++) {
      const start = headingLines[h]
      const end = h + 1 < headingLines.length ? headingLines[h + 1] : lines.length
      const heading = lines[start]
      const body = lines.slice(start + 1, end).join(' ')
      const sentences = body.split(/[.?!]+/).map(s => s.trim()).filter(s => s.length > 15)
      const scores = scoreSentences(sentences)
      const top = sentences
        .map((s, i) => ({ s, score: scores[i] }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(x => x.s)

      if (top.length > 0) {
        rawSections.push({ heading: heading.charAt(0).toUpperCase() + heading.slice(1).toLowerCase(), bullets: top })
      }
    }
  }

  if (rawSections.length >= 2) return rawSections

  // Fallback: split the full text into sentences and create thematic groups
  const allSentences = text
    .split(/[.?!]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && tokenize(s).length >= 4)

  if (allSentences.length === 0) {
    return [{ heading: 'Key Points', bullets: ['The document did not contain enough text to summarize. Please paste more content.'] }]
  }

  const scores = scoreSentences(allSentences)
  const ranked = allSentences
    .map((s, i) => ({ s, score: scores[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  // Split into 3 groups: Core Concepts, Supporting Details, Key Takeaways
  const g1 = ranked.slice(0, 4).map(x => x.s)
  const g2 = ranked.slice(4, 8).map(x => x.s)
  const g3 = ranked.slice(8, 12).map(x => x.s)

  const sections: Array<{ heading: string; bullets: string[] }> = []
  if (g1.length > 0) sections.push({ heading: 'Core Concepts', bullets: g1 })
  if (g2.length > 0) sections.push({ heading: 'Supporting Details', bullets: g2 })
  if (g3.length > 0) sections.push({ heading: 'Key Takeaways', bullets: g3 })

  return sections
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const summary = extractSections(text)

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('[Summarizer] Error:', error.message)
    return NextResponse.json({ error: 'Failed to summarize text.' }, { status: 500 })
  }
}
