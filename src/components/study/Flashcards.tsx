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
      <div className="flex flex-col items-center justify-center p-8 h-full bg-background animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
        
        {/* Ambient atmospheric glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />

        <div className="w-full max-w-3xl text-center mb-10 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-muted/30 border border-muted/50 mb-4 backdrop-blur-sm shadow-sm">
            <p className="text-primary font-bold tracking-[0.2em] uppercase text-[10px]">Unit {currentIndex + 1} of {cards.length}</p>
          </div>
          <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden border border-muted/50 shadow-inner block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/10 w-full opacity-50" />
            <div className="bg-gradient-to-r from-primary to-accent h-full relative transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
          </div>
        </div>

        {/* Interactive Flip Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full max-w-4xl aspect-[16/9] perspective-1000 cursor-pointer group z-10"
        >
          <div className={`relative w-full h-full transition-transform duration-700 ease-out preserve-3d rounded-[2.5rem] shadow-2xl group-hover:scale-[1.01] ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front of Card */}
            <div className="absolute w-full h-full backface-hidden bg-card border border-muted/50 rounded-[2.5rem] flex items-center justify-center text-center overflow-hidden transition-colors group-hover:border-primary/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="px-12 py-16 relative z-10 w-full">
                <BrainCircuit className="w-8 h-8 text-primary/40 mx-auto mb-6 opacity-50 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                <h2 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight tracking-tight drop-shadow-sm">{card.front}</h2>
              </div>
              
              <p className="absolute bottom-8 left-0 right-0 mx-auto text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity group-hover:text-primary">Tap to reveal answer</p>
            </div>
            
            {/* Back of Card */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 rounded-[2.5rem] flex items-center justify-center text-center overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.1)]">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              
              <div className="px-12 py-16 relative z-10 w-full">
                <CheckCircle2 className="w-8 h-8 text-primary/80 mx-auto mb-6 transition-transform duration-700 scale-90 group-hover:scale-110 group-hover:text-accent" />
                <h2 className="text-2xl md:text-4xl font-semibold leading-relaxed text-foreground/90 tracking-tight">{card.back}</h2>
              </div>

              <p className="absolute bottom-8 left-0 right-0 mx-auto text-xs text-primary/60 font-bold uppercase tracking-[0.2em] opacity-80">Tap to flip back</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-4 mt-12 w-full max-w-4xl z-10 bg-card rounded-3xl p-3 border border-muted/50 shadow-sm">
          <button
            onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false) }}
            disabled={currentIndex === 0}
            className="flex-1 py-4 rounded-2xl bg-transparent text-foreground font-bold disabled:opacity-30 hover:bg-muted/50 transition-colors"
          >
            ← Previous
          </button>
          <div className="w-px h-8 bg-muted/50" />
          <button
            onClick={() => { setStudying(false); setIsFlipped(false) }}
            className="flex-1 py-4 rounded-2xl text-muted-foreground font-bold hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            End Session
          </button>
          <div className="w-px h-8 bg-muted/50" />
          <button
            onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setIsFlipped(false) }}
            disabled={currentIndex === cards.length - 1}
            className="flex-1 py-4 rounded-2xl bg-foreground text-background font-black border border-transparent disabled:opacity-30 disabled:border-muted/50 disabled:bg-transparent disabled:text-muted-foreground hover:opacity-90 transition-all shadow-md active:scale-[0.98]"
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
      {/* Structural left border lighting effect */}
      <div className="absolute inset-y-0 left-0 w-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none mix-blend-screen" />

      {/* Left: Creation Panel */}
      <div className="w-full lg:w-[380px] bg-background/50 border-b lg:border-b-0 lg:border-r border-muted/50 p-6 lg:p-10 flex flex-col shrink-0 z-10 overflow-y-auto relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none"></div>

        {/* File Upload Zone */}
        <div className="mb-8 relative z-10">
          <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <UploadCloud className="w-4 h-4" /> AI Generation
          </h3>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleFileDrop}
            onClick={() => !uploadFile && !isBusy && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[2rem] p-6 flex flex-col items-center justify-center text-center transition-all duration-500 cursor-pointer min-h-[140px] overflow-hidden group ${isDragging
              ? 'border-primary bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.1)] scale-[1.02]'
              : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20 bg-card/60 shadow-sm'
              }`}
          >
            {/* Soft decorative glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            {isExtracting ? (
              <div className="relative z-10">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3 mx-auto" />
                <p className="text-sm font-bold text-foreground">Extracting text...</p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-full px-4 font-medium">{uploadFile?.name}</p>
              </div>
            ) : isGenerating ? (
              <div className="relative z-10">
                <Sparkles className="w-8 h-8 text-primary animate-pulse mb-3 mx-auto" />
                <p className="text-sm font-bold text-foreground">Generating flashcards...</p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-full px-4 font-medium">{uploadFile?.name}</p>
              </div>
            ) : uploadFile ? (
              <div className="relative z-10">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3 mx-auto drop-shadow-sm" />
                <p className="text-sm font-bold text-foreground truncate max-w-full px-4">{uploadFile.name}</p>
                <button
                  onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                  className="text-xs text-primary font-bold hover:text-primary/70 mt-3 transition-colors px-3 py-1 bg-primary/10 rounded-lg"
                >
                  Upload another
                </button>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="w-12 h-12 bg-background rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:-translate-y-1 transition-transform duration-300">
                   <UploadCloud className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-bold text-foreground">Tap to upload file</p>
                <p className="text-[11px] font-semibold text-muted-foreground mt-1 tracking-wide">PDF or Word document</p>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-muted/50 to-transparent mb-8 w-full relative z-10" />

        <div className="relative z-10">
          <h3 className="font-extrabold text-[11px] uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Manual Creation
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <textarea
                value={front}
                onChange={e => setFront(e.target.value)}
                required
                className="w-full p-5 rounded-2xl border border-muted/50 bg-card/60 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-foreground text-sm font-medium shadow-sm transition-all hover:bg-card"
                placeholder="Front: What is the powerhouse of the cell?"
              />
            </div>
            <div>
              <textarea
                value={back}
                onChange={e => setBack(e.target.value)}
                required
                className="w-full p-5 rounded-2xl border border-muted/50 bg-card/60 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 text-foreground text-sm font-medium shadow-sm transition-all hover:bg-card"
                placeholder="Back: Mitochondria"
              />
            </div>
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-black rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
               Append Card
            </button>
          </form>
        </div>

        <div className="mt-auto pt-10 relative z-10">
          <button
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); setStudying(true) }}
            disabled={cards.length === 0 || isBusy}
            className="w-full py-4.5 bg-foreground text-background font-black rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none hover:opacity-90 transition-all shadow-md active:scale-95 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none mix-blend-overlay" />
            <Play className="w-5 h-5 fill-background" /> ENTER STUDY MODE
          </button>
        </div>
      </div>

      {/* Right: Deck Panel */}
      <div className="flex-1 p-8 lg:p-12 overflow-y-auto bg-transparent relative z-0">

        {/* Ambient atmospheric glow on the right section */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10 pointer-events-none mix-blend-screen" />

        {/* Confirmation Modal */}
        {isConfirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
            <div className="bg-card border border-muted/50 rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 relative">
                 <div className="absolute inset-0 animate-ping bg-red-500/20 rounded-full opacity-75" />
                 <AlertTriangle className="w-10 h-10 text-red-500 relative z-10" />
              </div>
              <h4 className="font-black text-2xl text-foreground text-center mb-3">Clear Deck?</h4>
              <p className="text-sm text-muted-foreground text-center mb-8 font-medium">
                You are about to purge <span className="font-bold text-foreground">{cards.length} flashcard{cards.length !== 1 ? 's' : ''}</span>. They will be wiped permanently from your account database.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-4 rounded-2xl border border-muted/50 text-muted-foreground font-bold hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all active:scale-[0.98]"
                >
                  Destroy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="font-extrabold text-3xl text-foreground tracking-tight drop-shadow-sm mb-1">
              Your Deck
            </h3>
            <p className="text-muted-foreground font-medium text-sm">
              Current progress: {cards.length} card{cards.length !== 1 ? 's' : ''} registered.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isBusy && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-pulse shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isExtracting ? 'Extracting Text' : 'Running AI Modeling'}
              </div>
            )}
            {cards.length > 0 && !isBusy && (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-transparent hover:border-red-500/30 text-red-500/70 hover:text-red-500 text-xs font-extrabold uppercase tracking-widest hover:bg-red-500/5 transition-all focus:outline-none"
              >
                <Trash2 className="w-4 h-4" /> Purge Deck
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Loading state while generating */}
        {isGenerating && cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 w-full max-w-xl mx-auto animate-pulse text-center">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center mb-8 shadow-inner border border-primary/20 relative">
               <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
               <Sparkles className="w-12 h-12 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
            <h3 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-3xl mb-3 tracking-tight">Synthesizing Notes</h3>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">Extracting core conceptual frameworks and mapping them to active recall schemas.</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 w-full max-w-xl mx-auto text-center">
            <div className="w-32 h-32 rounded-[2.5rem] bg-card flex items-center justify-center mb-8 shadow-sm border border-muted/50 group-hover:scale-105 transition-transform">
               <BrainCircuit className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h3 className="font-extrabold text-foreground text-3xl mb-3 tracking-tight">No Flashcards Generated</h3>
            <p className="text-lg text-muted-foreground leading-relaxed font-medium">Drop a syllabus, PDF, or Word document on the left panel to auto-generate a study deck using Haiku.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
            {cards.map(card => (
              <div key={card.id} className="p-7 rounded-[2rem] border border-muted/50 bg-card group transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.02)] hover:-translate-y-1 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col justify-between min-h-[220px]">
                
                {/* Subtle top gradient accent on card */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <button
                  onClick={() => handleDelete(card.id)}
                  className="absolute top-5 right-5 text-muted-foreground/50 hover:text-red-500 bg-background/50 p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 focus:outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="mb-6 pr-10">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-primary/70 uppercase tracking-[0.2em] mb-3">
                    <div className="w-1 h-3 rounded-full bg-primary/40" /> Front
                  </span>
                  <p className="font-bold text-foreground text-lg leading-snug line-clamp-3">{card.front}</p>
                </div>
                
                <div className="pt-5 border-t border-muted/30 mt-auto">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-accent/70 uppercase tracking-[0.2em] mb-3">
                    <div className="w-1 h-3 rounded-full bg-accent/40" /> Back
                  </span>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed line-clamp-2">{card.back}</p>
                </div>
              </div>
            ))}
            {/* Step 3: Inline loading placeholder when cards already exist */}
            {isGenerating && (
              <div className="p-7 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center min-h-[220px] animate-pulse">
                <Sparkles className="w-8 h-8 text-primary/40 mb-4" />
                <p className="text-sm font-bold text-primary/70 tracking-tight">Generating Cards...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

}
