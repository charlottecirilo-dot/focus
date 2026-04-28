'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Wand2, Loader2, Sparkles, FileText, UploadCloud, 
  CheckCircle2, BookOpen, ChevronRight, X, FileUp, RotateCcw
} from 'lucide-react'

type SummarySection = {
  heading: string
  bullets: string[]
}

export default function Summarizer() {
  const [inputText, setInputText] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<SummarySection[] | null>(null)

  // File Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const runSummarize = useCallback(async (text: string) => {
    if (!text.trim()) return
    setSummary(null)
    setIsSummarizing(true)

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to summarize')
      
      if (data.summary && Array.isArray(data.summary)) {
        setSummary(data.summary)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsSummarizing(false)
    }
  }, [])

  const handleSummarize = (e: React.FormEvent) => {
    e.preventDefault()
    runSummarize(inputText)
  }

  const processFile = async (file: File) => {
    setUploadFile(file)
    setIsExtracting(true)
    setSummary(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const extractRes = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData
      })
      const extractData = await extractRes.json()
      
      if (!extractRes.ok) throw new Error(extractData.error || 'Extraction failed')
      
      setIsExtracting(false)
      if (extractData.text) {
        setInputText(extractData.text)
        runSummarize(extractData.text)
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message)
      setIsExtracting(false)
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const isBusy = isSummarizing || isExtracting

  return (
    <div className="flex h-full bg-background animate-in fade-in duration-300">
      
      {/* ── Left Control Sidebar ── */}
      <div className="w-80 shrink-0 border-r border-border bg-muted/20 flex flex-col">
        
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-bold text-sm text-foreground tracking-tight">Summary Tools</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Synthesize documents into insights</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Document Upload */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Target Document</p>
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
                  <p className="text-xs font-semibold text-foreground">Reading file...</p>
                </div>
              ) : uploadFile ? (
                <div className="space-y-2 w-full">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground truncate px-2">{uploadFile.name}</p>
                  <button 
                    onClick={e => { e.stopPropagation(); setUploadFile(null); setInputText('') }}
                    className="text-[11px] text-primary font-semibold hover:underline"
                  >Change document</button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileUp className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Drop document to summarize</p>
                  <p className="text-[11px] text-muted-foreground">PDF or Word</p>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Manual Input */}
          <div className="flex-1 flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Copy-Paste Context</p>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="w-full flex-1 min-h-[200px] px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
              placeholder="Paste long-form text here..."
            />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={() => runSummarize(inputText)}
            disabled={!inputText.trim() || isBusy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 disabled:pointer-events-none hover:opacity-90 transition-all shadow-sm"
          >
            {isSummarizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isSummarizing ? 'Synthesizing...' : 'Generate AI Summary'}
          </button>
        </div>
      </div>

      {/* ── Main Results Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-card">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">Structured Insights</h3>
            <p className="text-xs text-muted-foreground mt-0.5">AI-driven semantic analysis</p>
          </div>
          {summary && (
            <button
               onClick={() => { setSummary(null); setInputText(''); setUploadFile(null) }}
               className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground text-xs font-bold hover:bg-muted/50 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Start New
            </button>
          )}
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          
          {isSummarizing ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-primary/8 border border-primary/10 flex items-center justify-center mb-8 animate-pulse">
                <Wand2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-bold text-xl text-foreground mb-3 tracking-tight">Processing Intelligence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Evaluating semantic density and extracting core arguments for optimal retention.
              </p>
            </div>

          ) : summary ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">Summary Complete</h4>
                    <p className="text-xs text-muted-foreground">Document synthesized successfully</p>
                  </div>
               </div>

              <div className="grid gap-6">
                {summary.map((section, i) => (
                  <div key={i} className="group relative bg-muted/30 border border-border rounded-2xl p-6 hover:border-primary/20 hover:bg-background transition-all duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">{section.heading}</p>
                    <ul className="space-y-4">
                      {section.bullets.map((point, j) => (
                        <li key={j} className="flex items-start gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0 group-hover:bg-primary transition-colors" />
                          <p className="text-base text-foreground leading-relaxed opacity-90">{point}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40">
              <div className="w-20 h-20 rounded-3xl bg-muted border border-border flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">No Content Yet</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a document or paste research notes to generate a structured AI summary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
