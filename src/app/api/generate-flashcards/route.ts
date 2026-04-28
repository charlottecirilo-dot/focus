import { NextRequest, NextResponse } from 'next/server'

/**
 * Local rule-based flashcard generator.
 * No external API calls. Works by parsing the input text into
 * meaningful front/back pairs using pattern matching.
 */

type Flashcard = { front: string; back: string }

function generateFlashcardsFromText(text: string): Flashcard[] {
  const cards: Flashcard[] = []
  const seen = new Set<string>()

  const addCard = (front: string, back: string) => {
    front = front.trim()
    back = back.trim()
    if (!front || !back || front.length < 3 || back.length < 3) return
    const key = front.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    cards.push({ front, back })
  }

  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean)

  // Pattern 1: "Term - Definition" or "Term — Definition"
  for (const line of lines) {
    const match = line.match(/^(.+?)\s*[-—–]\s*(.+)$/)
    if (match && match[1].length < 80 && match[2].length > 5) {
      addCard(`What is ${match[1]}?`, match[2])
    }
  }

  // Pattern 2: "Term: definition" (colon-separated)
  for (const line of lines) {
    const match = line.match(/^([A-Z][^:]{2,60}):\s*(.{10,})$/)
    if (match) {
      addCard(`What is ${match[1]}?`, match[2])
    }
  }

  // Pattern 3: Numbered list items "1. Point about something important"
  const numberedItems: string[] = []
  for (const line of lines) {
    const match = line.match(/^\d+[\.\)]\s+(.+)$/)
    if (match) numberedItems.push(match[1])
  }
  if (numberedItems.length >= 3) {
    // Group them into a card about the list
    const heading = lines.find(l => !l.match(/^\d+[\.\)]/)) || 'Key Points'
    for (const item of numberedItems) {
      const termMatch = item.match(/^([A-Z][a-zA-Z\s]{2,30})\s*[-–:]\s*(.+)/)
      if (termMatch) {
        addCard(`What is ${termMatch[1].trim()}?`, termMatch[2].trim())
      } else if (item.match(/\bis\b|\bare\b|\bmeans\b|\brefers to\b/i)) {
        const split = item.split(/\s+is\s+|\s+are\s+|\s+means\s+|\s+refers to\s+/i)
        if (split.length >= 2) {
          addCard(`What is ${split[0].trim()}?`, split.slice(1).join(' is ').trim())
        }
      } else {
        addCard(item.length < 60 ? item : item.substring(0, 57) + '…', `From the list: "${heading.substring(0, 80)}"`)
      }
    }
  }

  // Pattern 4: Bullet points "• Key concept explanation"
  for (const line of lines) {
    const match = line.match(/^[•\*\-]\s+(.+)$/)
    if (match) {
      const content = match[1]
      const splitMatch = content.match(/^([A-Z][a-zA-Z\s]{2,40})[:\s]+[-–]\s*(.+)/)
      if (splitMatch) {
        addCard(`What is ${splitMatch[1].trim()}?`, splitMatch[2].trim())
      } else if (content.match(/\bis\b|\bare\b|\bmeans\b|\brefers to\b/i)) {
        const parts = content.split(/\s+is\s+|\s+are\s+|\s+means\s+|\s+refers to\s+/i)
        if (parts.length >= 2 && parts[0].length < 60) {
          addCard(`What is ${parts[0].trim()}?`, parts.slice(1).join(' is ').trim())
        }
      }
    }
  }

  // Pattern 5: Sentences with "is defined as", "refers to", "means", "is known as"
  const sentences = text.split(/[.?!]+/).map(s => s.trim()).filter(s => s.length > 15)
  for (const sent of sentences) {
    const patterns = [
      /^(.+?)\s+is defined as\s+(.+)$/i,
      /^(.+?)\s+refers to\s+(.+)$/i,
      /^(.+?)\s+is known as\s+(.+)$/i,
      /^(.+?)\s+is the process of\s+(.+)$/i,
      /^(.+?)\s+is a\s+(.+)$/i,
      /^(.+?)\s+are\s+(.+)$/i,
    ]
    for (const pattern of patterns) {
      const m = sent.match(pattern)
      if (m && m[1].length < 60 && m[2].length > 5) {
        addCard(`What is ${m[1].trim()}?`, m[2].trim())
        break
      }
    }
    if (cards.length >= 15) break
  }

  // Fallback: split into chunks and make Q&A pairs from consecutive sentences
  if (cards.length < 3 && sentences.length >= 2) {
    for (let i = 0; i < Math.min(sentences.length - 1, 8); i += 2) {
      const q = sentences[i]
      const a = sentences[i + 1]
      if (q.length > 15 && a.length > 10) {
        addCard(q.endsWith('?') ? q : q + '?', a)
      }
    }
  }

  return cards.slice(0, 12)
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const flashcards = generateFlashcardsFromText(text)

    if (flashcards.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract flashcards from this text. Try pasting text with clear definitions, bullet points, or numbered lists.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ flashcards })
  } catch (error: any) {
    console.error('[Flashcard Generator] Error:', error.message)
    return NextResponse.json({ error: 'Failed to process text.' }, { status: 500 })
  }
}
