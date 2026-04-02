'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { Plus, Trash2, Play, BrainCircuit } from 'lucide-react'

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
  
  // Study View Flags
  const [studying, setStudying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  
  const { user } = useUserStore()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Get user's flashcards from Supabase
  const fetchCards = async () => {
    const { data } = await supabase.from('flashcards').select('*').order('created_at', { ascending: false })
    if (data) setCards(data)
    setLoading(false)
  }

  // Create document in db
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !front.trim() || !back.trim()) return

    const { data } = await supabase.from('flashcards').insert({
      user_id: user.id,
      front,
      back
    }).select().single()

    if (data) {
      setCards([data, ...cards])
      setFront('')
      setBack('')
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id)
    setCards(cards.filter(c => c.id !== id))
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
        
        {/* Interactive Flip Card leveraging 3D css utils */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full max-w-3xl aspect-[16/9] perspective-1000 cursor-pointer group"
        >
          <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-xl rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front Face */}
            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-[2.5rem] p-16 flex items-center justify-center text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary-foreground leading-tight">{card.front}</h2>
              <p className="absolute bottom-8 text-sm text-primary-foreground/50 font-bold uppercase tracking-widest">Tap to flip card</p>
            </div>
            
            {/* Back Face */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-card border border-muted/50 rounded-[2.5rem] p-16 flex items-center justify-center text-center">
              <h2 className="text-3xl md:text-4xl font-semibold leading-relaxed text-foreground">{card.back}</h2>
              <p className="absolute bottom-8 text-sm text-muted-foreground/50 font-bold uppercase tracking-widest">Tap to flip back</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-12 w-full max-w-3xl">
          <button 
            onClick={() => {
               setCurrentIndex(Math.max(0, currentIndex - 1))
               setIsFlipped(false)
            }}
            disabled={currentIndex === 0}
            className="flex-1 py-4 rounded-2xl bg-muted/50 text-foreground font-bold disabled:opacity-50 hover:bg-muted transition-colors"
          >
            ← Previous
          </button>
          <button 
            onClick={() => {
              setStudying(false)
              setIsFlipped(false)
            }}
            className="px-8 py-4 rounded-2xl border border-muted-foreground/20 text-muted-foreground font-bold hover:bg-muted/30 transition-colors"
          >
            End Session
          </button>
          <button 
            onClick={() => {
               setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1))
               setIsFlipped(false)
            }}
            disabled={currentIndex === cards.length - 1}
            className="flex-1 py-4 rounded-2xl bg-accent text-accent-foreground font-bold disabled:opacity-50 hover:bg-accent/90 transition-colors shadow-sm"
          >
            Next Unit →
          </button>
        </div>
      </div>
    )
  }

  // Renders Creation layout & Overview board
  return (
    <div className="flex h-full animate-in fade-in duration-300">
      <div className="w-[30%] bg-muted/5 border-r border-muted/50 p-8 flex flex-col shrink-0">
        <h3 className="font-extrabold text-xl mb-8 text-foreground">Add New Card</h3>
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
            onClick={() => {
              setCurrentIndex(0)
              setIsFlipped(false)
              setStudying(true)
            }}
            disabled={cards.length === 0}
            className="w-full py-4 bg-foreground text-background font-extrabold rounded-2xl flex items-center justify-center gap-2.5 hover:opacity-90 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Play className="w-5 h-5 fill-background" /> ENTER STUDY MODE
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto bg-background px-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-extrabold text-2xl text-foreground">Your Deck <span className="text-muted-foreground font-medium text-lg ml-2">({cards.length} cards)</span></h3>
        </div>
        
        {cards.length === 0 ? (
          <div className="text-center py-32 text-muted-foreground w-full max-w-lg mx-auto">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <BrainCircuit className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <p className="font-extrabold text-foreground text-2xl mb-2">Build your knowledge base</p>
            <p className="text-base text-muted-foreground leading-relaxed">Create flashcards on the left panel to start organizing concepts via spaced repetition mechanics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map(card => (
              <div key={card.id} className="p-6 rounded-2xl border border-muted/50 bg-card group transition-all hover:border-primary/40 hover:shadow-md relative overflow-hidden">
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
          </div>
        )}
      </div>
    </div>
  )
}
