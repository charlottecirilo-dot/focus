'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import {
  Plus, Trash2, Play, BrainCircuit, UploadCloud, CheckCircle2,
  Loader2, Sparkles, AlertTriangle, ChevronLeft, ChevronRight,
  RotateCcw, X, FileUp
} from 'lucide-react'

type Flashcard = {
  id: string
  front: string
  back: string
  created_at: string
}

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [studying, setStudying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useUserStore()
  const [supabase] = useState(() => createClient())

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!user) return
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCards = async () => {
    const { data, error } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching cards:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }
    if (data) setCards(data)
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert("You are not fully logged in. Please refresh the page to sync your session.")
      return
    }
    if (!front.trim() || !back.trim()) return
    const { data, error } = await supabase.from('flashcards').insert({ user_id: user.id, front, back }).select().single()
    if (error) {
      console.error('Error creating card:', error)
      alert("Could not save to database: " + error.message)
      return
    }
    if (data) {
      setCards(prev => [data, ...prev])
      setFront('')
      setBack('')
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id)
    if (error) alert('Could not delete: ' + error.message)
    else setCards(prev => prev.filter(c => c.id !== id))
  }

  const handleDeleteAll = async () => {
    if (!user || cards.length === 0) return
    const ids = cards.map(c => c.id)
    const { error } = await supabase.from('flashcards').delete().in('id', ids)
    if (error) { alert('Failed to clear deck: ' + error.message); return }
    setCards([])
    setIsConfirmingDelete(false)
  }

  const processUploadedFile = async (file: File) => {
    if (!user) return
    setUploadFile(file)
    setIsExtracting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const extractRes = await fetch('/api/extract-text', { method: 'POST', body: formData })
      const extractData = await extractRes.json()
      if (!extractRes.ok) throw new Error(extractData.error || 'Failed to extract text.')
      setIsExtracting(false)
      setIsGenerating(true)
      const generateRes = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractData.text })
      })
      const generateData = await generateRes.json()
      if (!generateRes.ok) throw new Error(generateData.error || 'Failed to generate flashcards.')
      if (generateData.flashcards && Array.isArray(generateData.flashcards)) {
        const newCards: Flashcard[] = []
        for (const pair of generateData.flashcards) {
          const { data, error } = await supabase.from('flashcards').insert({ user_id: user.id, front: pair.front, back: pair.back }).select().single()
          if (error) {
            console.error('Supabase Insert Error:', error)
          } else if (data) {
            newCards.push(data)
          }
        }
        if (newCards.length === 0 && generateData.flashcards.length > 0) {
          throw new Error('Cards were generated but could not be saved to your database.')
        }
        setCards(prev => [...newCards, ...prev])
      }
    } catch (err: any) {
      console.error(err)
      alert('Error generating cards: ' + err.message)
    } finally {
      setIsExtracting(false)
      setIsGenerating(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processUploadedFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processUploadedFile(file)
  }

  const isBusy = isExtracting || isGenerating

  // ─── Confirm Delete Modal (inline portal to escape overflow:hidden) ───
  const confirmModal = isConfirmingDelete && mounted ? createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setIsConfirmingDelete(false)}
    >
      <div
        className="bg-card border border-border rounded-2xl p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 mb-5 mx-auto border border-red-100 dark:border-red-900">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h4 className="font-bold text-xl text-foreground text-center mb-2 tracking-tight">Clear Entire Deck?</h4>
        <p className="text-sm text-muted-foreground text-center mb-7 leading-relaxed">
          This will permanently delete{' '}
          <span className="font-semibold text-foreground">
            {cards.length} flashcard{cards.length !== 1 ? 's' : ''}
          </span>{' '}
          from your account. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsConfirmingDelete(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold text-sm hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-sm"
          >
            Delete All
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  // ─── Study Session View ───────────────────────────────────────────────────
  if (studying && cards.length > 0) {
    const card = cards[currentIndex]
    const progress = ((currentIndex + 1) / cards.length) * 100
    return (
      <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
        {/* Study Top Bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <button onClick={() => { setStudying(false); setIsFlipped(false) }} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" /> Exit Study Mode
          </button>
          <div className="text-sm font-semibold text-muted-foreground">
            Card <span className="text-foreground font-bold">{currentIndex + 1}</span> of {cards.length}
          </div>
          <button onClick={() => { setCurrentIndex(0); setIsFlipped(false) }} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" />Restart
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <div onClick={() => setIsFlipped(!isFlipped)} className="w-full max-w-2xl aspect-video perspective-1000 cursor-pointer group">
            <div className={`relative w-full h-full transition-transform duration-500 ease-out preserve-3d rounded-2xl shadow-lg ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-card border border-border rounded-2xl flex flex-col items-center justify-center text-center p-10 group-hover:border-primary/40 transition-colors">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Question</span>
                <p className="text-2xl md:text-3xl font-bold text-foreground leading-snug">{card.front}</p>
                <span className="absolute bottom-6 text-xs text-muted-foreground font-medium">Click to reveal answer</span>
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col items-center justify-center text-center p-10">
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Answer</span>
                <p className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">{card.back}</p>
                <span className="absolute bottom-6 text-xs text-muted-foreground font-medium">Click to flip back</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false) }}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border font-semibold text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setIsFlipped(false) }}
              disabled={currentIndex === cards.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background font-bold text-sm disabled:opacity-30 disabled:pointer-events-none hover:opacity-85 transition-all shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Loading deck...</span>
      </div>
    </div>
  )

  // ─── Main Layout ──────────────────────────────────────────────────────────
  return (
    <>
      {confirmModal}
      <div className="flex h-full">

        {/* ── Left Sidebar ── */}
        <div className="w-80 shrink-0 border-r border-border bg-muted/20 flex flex-col">

          {/* Sidebar Header */}
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-bold text-sm text-foreground tracking-tight">Study Tools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Generate or create flashcards</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* AI Generation */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Generation</p>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
                onDrop={handleFileDrop}
                onClick={() => !isBusy && !uploadFile && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[120px] ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30 bg-card'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />

                {isExtracting ? (
                  <div className="space-y-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-foreground">Extracting text...</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{uploadFile?.name}</p>
                  </div>
                ) : isGenerating ? (
                  <div className="space-y-2">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse mx-auto" />
                    <p className="text-xs font-semibold text-foreground">Generating flashcards...</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{uploadFile?.name}</p>
                  </div>
                ) : uploadFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="text-xs font-semibold text-foreground truncate max-w-[180px]">{uploadFile.name}</p>
                    <button
                      onClick={e => { e.stopPropagation(); setUploadFile(null) }}
                      className="text-[11px] text-primary font-semibold hover:underline"
                    >Upload another</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileUp className="w-6 h-6 text-muted-foreground mx-auto" />
                    <p className="text-xs font-semibold text-foreground">Drop file or click to upload</p>
                    <p className="text-[11px] text-muted-foreground">PDF or Word document</p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Manual Creation */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Manual Card</p>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Front</label>
                  <textarea
                    value={front}
                    onChange={e => setFront(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50 transition-all"
                    placeholder="Question or concept..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">Back</label>
                  <textarea
                    value={back}
                    onChange={e => setBack(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50 transition-all"
                    placeholder="Answer or definition..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-foreground text-background text-sm font-bold hover:opacity-85 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />Add Card
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Footer — Study Mode Button */}
          <div className="p-6 border-t border-border">
            <button
              onClick={() => { setCurrentIndex(0); setIsFlipped(false); setStudying(true) }}
              disabled={cards.length === 0 || isBusy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:opacity-90 transition-all shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Study Session
            </button>
          </div>
        </div>

        {/* ── Main Content Panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Panel Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
            <div>
              <h3 className="font-bold text-base text-foreground tracking-tight">Your Deck</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cards.length} card{cards.length !== 1 ? 's' : ''} in this deck
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isBusy && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15 text-primary text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {isExtracting ? 'Extracting…' : 'Generating…'}
                </div>
              )}
              {cards.length > 0 && !isBusy && (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-bold hover:border-red-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:border-red-800 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />Clear Deck
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-8">
            {isGenerating && cards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-5">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Generating Flashcards</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Analyzing your document and extracting key concepts...</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-5">
                  <BrainCircuit className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">No Cards Yet</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Upload a document or add cards manually from the panel on the left to build your deck.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
                {cards.map(card => (
                  <div
                    key={card.id}
                    className="group relative bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-h-[160px] animate-in fade-in slide-in-from-bottom-2"
                  >
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="pr-8 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Front</span>
                      <p className="font-semibold text-foreground text-sm leading-snug line-clamp-3">{card.front}</p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Back</span>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{card.back}</p>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="border-2 border-dashed border-primary/20 rounded-xl p-5 flex flex-col items-center justify-center text-center min-h-[160px] animate-pulse">
                    <Sparkles className="w-6 h-6 text-primary/40 mb-3" />
                    <p className="text-xs font-semibold text-primary/60">Adding new cards...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
