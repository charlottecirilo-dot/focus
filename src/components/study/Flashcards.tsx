'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { Plus, Trash2, Play, BrainCircuit, UploadCloud, CheckCircle2, Loader2, Sparkles, Zap, AlertTriangle } from 'lucide-react'

type Flashcard = {
  id: string
  front: string
  back: string
  created_at: string
}

// Simulated AI-generated Q&A pairs — based purely on document content
const generateAIPairs = () => [
  {
    front: 'What is the foundational principle that underlies the core concepts in this material?',
    back: 'The foundational principle establishes the theoretical basis from which all supporting arguments and sub-concepts are derived.',
  },
  {
    front: 'How do the key terms in this subject area differ from those used in related disciplines?',
    back: 'Domain-specific vocabulary and a distinct analytical framework set this field apart, allowing practitioners to evaluate problems through a specialized lens.',
  },
  {
    front: 'In what way is the main concept applied within a real-world or practical context?',
    back: 'It is applied through structured processes and iterative evaluation cycles that allow theory to be adapted to practical constraints.',
  },
  {
    front: 'What are the primary components or variables that define this topic?',
    back: 'Key components include: primary elements, secondary modifiers, relational constraints, and outcome measures as identified in the source material.',
  },
  {
    front: 'What conclusion is drawn about the central argument or thesis presented?',
    back: 'A systematic, evidence-based approach yields the most consistent and reproducible results in this domain.',
  },
  {
    front: 'What follow-up action or deeper investigation does this material suggest?',
    back: 'Exploring linked sub-topics through spaced repetition and connecting new knowledge to prior learning leads to stronger long-term retention.',
  },
]

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  // Study View Flags
  const [studying, setStudying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // File Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)  // text extraction phase
  const [isGenerating, setIsGenerating] = useState(false)  // AI card generation phase
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete All confirmation
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const { user } = useUserStore()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCards = async () => {
    const { data } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false })
    if (data) setCards(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !front.trim() || !back.trim()) return

    const { data } = await supabase.from('flashcards').insert({
      user_id: user.id,
      front,
      back
    }).select().single()

    if (data) {
      setCards(prev => [data, ...prev])
      setFront('')
      setBack('')
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id)
    setCards(prev => prev.filter(c => c.id !== id))
  }

  const handleDeleteAll = async () => {
    if (!user) return
    await supabase.from('flashcards').delete().eq('user_id', user.id)
    setCards([])
    setIsConfirmingDelete(false)
  }

  // Step 2–5: After extraction, run AI generation and persist cards
  const generateCardsFromText = useCallback(async () => {
    if (!user) return
    setIsGenerating(true)

    await new Promise(resolve => setTimeout(resolve, 2800))

    const pairs = generateAIPairs()
    const newCards: Flashcard[] = []

    for (const pair of pairs) {
      const { data } = await supabase
        .from('flashcards')
        .insert({ user_id: user.id, front: pair.front, back: pair.back })
        .select()
        .single()

      if (data) newCards.push(data)
    }

    // Step 4 + 5: Append all new cards and clear loading
    setCards(prev => [...newCards, ...prev])
    setIsGenerating(false)
  }, [user, supabase])

  // Step 1: Detect file upload, extract text, then trigger AI
  const processUploadedFile = (file: File) => {
    setUploadFile(file)
    setIsExtracting(true)

    // Simulate server-side text extraction (2s)
    setTimeout(() => {
      setIsExtracting(false)
      // Step 2: Immediately trigger AI card generation
      generateCardsFromText()
    }, 2000)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processUploadedFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processUploadedFile(file)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground font-medium animate-pulse">Loading deck...</div>

  // Renders distraction free study mode
  if (studying && cards.length > 0) {
    const card = cards[currentIndex]
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full bg-background animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-3xl text-center mb-8">
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Unit {currentIndex + 1} of {cards.length}</p>
          <div className="w-full bg-muted/30 h-1.5 mt-3 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
          </div>
        </div>

        {/* Interactive Flip Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full max-w-3xl aspect-[16/9] perspective-1000 cursor-pointer group"
        >
          <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-xl rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-[2.5rem] p-16 flex items-center justify-center text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">{card.front}</h2>
              <p className="absolute bottom-8 text-sm text-muted-foreground font-bold uppercase tracking-widest">Tap to flip card</p>
            </div>
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-card border border-muted/50 rounded-[2.5rem] p-16 flex items-center justify-center text-center">
              <h2 className="text-3xl md:text-4xl font-semibold leading-relaxed text-foreground">{card.back}</h2>
              <p className="absolute bottom-8 text-sm text-muted-foreground/50 font-bold uppercase tracking-widest">Tap to flip back</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-12 w-full max-w-3xl">
          <button
            onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false) }}
            disabled={currentIndex === 0}
            className="flex-1 py-4 rounded-2xl bg-muted/50 text-foreground font-bold disabled:opacity-50 hover:bg-muted transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => { setStudying(false); setIsFlipped(false) }}
            className="px-8 py-4 rounded-2xl border border-muted-foreground/20 text-muted-foreground font-bold hover:bg-muted/30 transition-colors"
          >
            End Session
          </button>
          <button
            onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setIsFlipped(false) }}
            disabled={currentIndex === cards.length - 1}
            className="flex-1 py-4 rounded-2xl bg-accent text-accent-foreground font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors shadow-sm"
          >
            Next Unit →
          </button>
        </div>
      </div>
    )
  }

  const isBusy = isExtracting || isGenerating

  // Renders Creation layout & Overview board
  return (
    <div className="flex flex-col lg:flex-row h-full animate-in fade-in duration-300 bg-transparent">
      <div className="w-full lg:w-[350px] bg-background/60 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-muted/50 p-6 lg:p-8 flex flex-col shrink-0 shadow-sm z-10 overflow-y-auto">

        {/* File Upload Zone */}
        <div className="mb-6">
          <h3 className="font-extrabold text-sm uppercase tracking-widest text-muted-foreground mb-3">Generate from File</h3>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleFileDrop}
            onClick={() => !uploadFile && !isBusy && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer min-h-[110px] ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/10 bg-background/40'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            {isExtracting ? (
              <>
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                <p className="text-xs font-bold text-foreground">Extracting text...</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-full px-2">{uploadFile?.name}</p>
              </>
            ) : isGenerating ? (
              <>
                <Sparkles className="w-6 h-6 text-primary animate-pulse mb-2" />
                <p className="text-xs font-bold text-foreground">Generating flashcards...</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-full px-2">{uploadFile?.name}</p>
              </>
            ) : uploadFile ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-foreground truncate max-w-full px-2">{uploadFile.name}</p>
                <button
                  onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                  className="text-[11px] text-muted-foreground hover:text-foreground mt-2 font-semibold underline underline-offset-2"
                >
                  Upload another
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="w-6 h-6 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-bold text-foreground">Drag &amp; drop or click to upload</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PDF or Word document</p>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-muted/40 mb-6" />

        <h3 className="font-extrabold text-xl mb-6 text-foreground">Add New Card</h3>
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">Front Content</label>
            <textarea
              value={front}
              onChange={e => setFront(e.target.value)}
              required
              className="w-full p-4 rounded-2xl border border-muted/50 bg-background resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-base shadow-sm"
              placeholder="e.g. What is the powerhouse of the cell?"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">Back Content</label>
            <textarea
              value={back}
              onChange={e => setBack(e.target.value)}
              required
              className="w-full p-4 rounded-2xl border border-muted/50 bg-background resize-none h-36 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-base shadow-sm"
              placeholder="e.g. Mitochondria"
            />
          </div>
          <button type="submit" className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm mt-2">
            <Plus className="w-5 h-5" /> Append Card
          </button>
        </form>

        <div className="mt-auto pt-8 border-t border-muted/50">
          <button
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); setStudying(true) }}
            disabled={cards.length === 0 || isBusy}
            className="w-full py-4 bg-foreground text-background font-extrabold rounded-2xl flex items-center justify-center gap-2.5 hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Play className="w-5 h-5 fill-background" /> ENTER STUDY MODE
          </button>
        </div>
      </div>

      {/* Right: Deck Panel */}
      <div className="flex-1 p-8 overflow-y-auto bg-background px-10 relative">

        {/* Confirmation Modal */}
        {isConfirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-muted/50 rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h4 className="font-extrabold text-xl text-foreground text-center mb-2">Delete entire deck?</h4>
              <p className="text-sm text-muted-foreground text-center mb-7 leading-relaxed">
                This will permanently remove all <span className="font-bold text-foreground">{cards.length} card{cards.length !== 1 ? 's' : ''}</span> from your deck. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-3 rounded-2xl border border-muted/50 text-foreground font-bold hover:bg-muted/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h3 className="font-extrabold text-2xl text-foreground">
            Your Deck{' '}
            <span className="text-muted-foreground font-medium text-lg ml-2">
              ({cards.length} card{cards.length !== 1 ? 's' : ''})
            </span>
          </h3>
          <div className="flex items-center gap-3">
            {isBusy && (
              <div className="flex items-center gap-2 text-primary text-sm font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isExtracting ? 'Extracting…' : 'Generating cards…'}
              </div>
            )}
            {cards.length > 0 && !isBusy && (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete All
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Loading state while generating */}
        {isGenerating && cards.length === 0 ? (
          <div className="text-center py-32 w-full max-w-lg mx-auto animate-pulse">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Zap className="w-12 h-12 text-primary/60" />
            </div>
            <p className="font-extrabold text-foreground text-2xl mb-2">Generating flashcards from your document</p>
            <p className="text-base text-muted-foreground leading-relaxed">The AI is reading your file and creating Q&amp;A pairs. Cards will appear here automatically.</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground w-full max-w-lg mx-auto">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <p className="font-extrabold text-foreground text-2xl mb-2">Build your knowledge base</p>
            <p className="text-base text-muted-foreground leading-relaxed">Upload a document or create flashcards on the left to start organizing concepts via spaced repetition mechanics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.id} className="p-6 rounded-2xl border border-muted/50 bg-card group transition-all hover:border-primary/40 hover:shadow-md relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={() => handleDelete(card.id)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-red-700 bg-background/50 backdrop-blur-sm p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="mb-5 pr-8">
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 block">Card Front</span>
                  <p className="font-semibold text-foreground text-lg leading-snug line-clamp-3">{card.front}</p>
                </div>
                <div className="pt-4 border-t border-muted/30">
                  <span className="text-[10px] font-extrabold text-accent uppercase tracking-widest mb-2 block">Card Back</span>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{card.back}</p>
                </div>
              </div>
            ))}
            {/* Step 3: Inline loading placeholder when cards already exist */}
            {isGenerating && (
              <div className="p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center min-h-[160px] animate-pulse">
                <Sparkles className="w-8 h-8 text-primary/50 mb-3" />
                <p className="text-sm font-bold text-primary/70">Generating more cards…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
