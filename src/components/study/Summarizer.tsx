'use client'

import { useState } from 'react'
import { Wand2, Loader2, Sparkles, FileText } from 'lucide-react'

// Render a purely aesthetic/simulated summarizer
export default function Summarizer() {
  const [inputText, setInputText] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)

  const handleSummarize = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    
    setIsSummarizing(true)
    // Timeout to simulate an AI operation
    setTimeout(() => {
      setIsSummarizing(false)
    }, 2500)
  }

  return (
    <div className="h-full flex flex-col lg:flex-row animate-in fade-in duration-300">
      {/* Left Input Half */}
      <div className="w-full lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-muted/50 flex flex-col h-full bg-background/60 backdrop-blur-md rounded-t-[2rem] lg:rounded-tr-none lg:rounded-l-[2rem] z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
             <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          <h3 className="font-extrabold text-2xl text-foreground">Paste Text</h3>
        </div>
        
        <p className="text-base text-muted-foreground mb-6 leading-relaxed">
          Paste your lecture transcripts, dense articles, or long notes here. The AI will synthesize it into core digestible concepts and bullet points.
        </p>
        
        <form onSubmit={handleSummarize} className="flex-1 flex flex-col relative">
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full p-6 rounded-3xl border border-muted/50 bg-card resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground text-lg leading-宽松 shadow-inner"
            placeholder="E.g., The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms..."
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isSummarizing}
            className="absolute bottom-6 left-6 right-6 py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
          >
            {isSummarizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
            {isSummarizing ? 'Analyzing context & synthesizing...' : 'Generate Core Summary'}
          </button>
        </form>
      </div>
      
      {/* Right Output Half */}
      <div className="w-full lg:w-1/2 p-6 lg:p-10 bg-card flex flex-col relative overflow-y-auto">
        {isSummarizing ? (
           <div className="text-center animate-pulse m-auto">
             <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
               <Wand2 className="w-12 h-12 text-accent animate-bounce" />
             </div>
             <p className="text-3xl font-extrabold text-foreground mb-3">Extracting Insight Pipeline...</p>
             <p className="text-muted-foreground text-base max-w-sm mx-auto">Evaluating semantic tokens and reducing density for optimal learning.</p>
           </div>
        ) : (
          <div className="text-center text-muted-foreground m-auto">
            <div className="w-24 h-24 bg-card border border-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-2xl font-extrabold text-foreground mb-3">Awaiting Context Input</p>
            <p className="text-base leading-relaxed max-w-xs mx-auto">Enter source material on the left and engage the AI to populate this space with structured study aids.</p>
          </div>
        )}
      </div>
    </div>
  )
}
