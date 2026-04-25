'use client'

import { useState, useRef, useCallback } from 'react'
import { Wand2, Loader2, Sparkles, FileText, UploadCloud, CheckCircle2, BookOpen, ChevronRight } from 'lucide-react'

type SummarySection = {
  heading: string
  bullets: string[]
}

// Render a purely aesthetic/simulated summarizer
export default function Summarizer() {
  const [inputText, setInputText] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summary, setSummary] = useState<SummarySection[] | null>(null)

  // File Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Core summarize logic — can be called programmatically or via form submit
  const runSummarize = useCallback((text: string) => {
    if (!text.trim()) return
    setSummary(null)
    setIsSummarizing(true)

    // Simulate AI summarization with a structured result
    setTimeout(() => {
      setSummary([
        {
          heading: 'Core Concepts',
          bullets: [
            'Primary theme extracted from provided source material.',
            'Key terms and definitions identified by the AI model.',
            'Central argument or subject matter synthesized.',
          ],
        },
        {
          heading: 'Supporting Details',
          bullets: [
            'Evidence and examples drawn from the document.',
            'Contextual information that supports the core thesis.',
            'Relationships between sub-topics mapped and simplified.',
          ],
        },
        {
          heading: 'Key Takeaways',
          bullets: [
            'Actionable insight #1 distilled for learning efficiency.',
            'Actionable insight #2 — review and connect to prior knowledge.',
            'Suggested follow-up: explore linked topics for deeper understanding.',
          ],
        },
      ])
      setIsSummarizing(false)
    }, 2500)
  }, [])

  const handleSummarize = (e: React.FormEvent) => {
    e.preventDefault()
    runSummarize(inputText)
  }

  const processFile = (file: File) => {
    setUploadFile(file)
    setIsExtracting(true)
    setSummary(null)

    // Step 1 + 2: Simulate server-side text extraction
    setTimeout(() => {
      const extracted = `Extracted content from "${file.name}": The document explores key concepts, methodologies, and findings relevant to the subject area. Dense academic language is simplified through AI analysis. Core ideas, supporting arguments, and actionable insights are identified for efficient knowledge retention via spaced repetition and active recall techniques.`
      setIsExtracting(false)
      setInputText(extracted)

      // Step 3: Immediately trigger summarization once text is ready
      runSummarize(extracted)
    }, 2000)
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

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadFile(null)
    setInputText('')
    setSummary(null)
  }

  return (
    <div className="h-full flex flex-col lg:flex-row animate-in fade-in duration-300">
      {/* Left Input Half */}
      <div className="w-full lg:w-1/2 p-6 lg:p-10 border-b lg:border-b-0 lg:border-r border-muted/50 flex flex-col h-full bg-background/60 backdrop-blur-md rounded-t-[2rem] lg:rounded-tr-none lg:rounded-l-[2rem] z-10">

        {/* File Upload Zone */}
        <div className="mb-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2.5">Upload Document</p>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleFileDrop}
            onClick={() => !uploadFile && !isExtracting && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 cursor-pointer ${isDragging
              ? 'border-accent bg-accent/5 scale-[1.01]'
              : 'border-muted-foreground/20 hover:border-accent/40 hover:bg-muted/10 bg-background/40'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDragging ? 'bg-accent/20' : 'bg-muted/30'
              }`}>
              {isExtracting
                ? <Loader2 className="w-5 h-5 text-accent animate-spin" />
                : uploadFile
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  : <UploadCloud className="w-5 h-5 text-muted-foreground/60" />
              }
            </div>
            <div className="flex-1 min-w-0">
              {isExtracting ? (
                <>
                  <p className="text-sm font-bold text-foreground">Extracting text...</p>
                  <p className="text-xs text-muted-foreground truncate">{uploadFile?.name}</p>
                </>
              ) : uploadFile ? (
                <>
                  <p className="text-sm font-bold text-foreground truncate">{uploadFile.name}</p>
                  <button
                    onClick={handleReset}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold underline underline-offset-2"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground">Drag &amp; drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">PDF or Word document • Text will auto-populate below</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-muted/40 mb-5" />

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
            className="flex-1 w-full p-6 rounded-3xl border border-muted/50 bg-card resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground text-lg leading-relaxed shadow-inner"
            placeholder="E.g., The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms..."
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSummarizing || isExtracting}
            className="absolute bottom-6 left-6 right-6 py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/90 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
          >
            {isSummarizing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
            {isSummarizing ? 'Analyzing context & synthesizing...' : 'Generate Core Summary'}
          </button>
        </form>
      </div>

      {/* Right Output Half */}
      <div className="w-full lg:w-1/2 p-6 lg:p-10 bg-card flex flex-col relative overflow-y-auto">

        {/* Step 4 — Loading state while AI processes */}
        {(isExtracting || isSummarizing) ? (
          <div className="text-center animate-pulse m-auto">
            <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Wand2 className="w-12 h-12 text-accent animate-bounce" />
            </div>
            <p className="text-3xl font-extrabold text-foreground mb-3">
              {isExtracting ? 'Extracting document text...' : 'Generating summary...'}
            </p>
            <p className="text-muted-foreground text-base max-w-sm mx-auto">
              {isExtracting
                ? 'Parsing your document and preparing it for AI analysis.'
                : 'Evaluating semantic tokens and reducing density for optimal learning.'}
            </p>
          </div>

        ) : summary ? (
          /* Step 5 — Display finished summary */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-extrabold text-xl text-foreground">AI Summary</p>
                {uploadFile && (
                  <p className="text-xs text-muted-foreground truncate max-w-[260px]">{uploadFile.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {summary.map((section, i) => (
                <div key={i} className="bg-background/60 rounded-2xl p-5 border border-muted/40 shadow-sm">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-accent mb-3">{section.heading}</p>
                  <ul className="space-y-2.5">
                    {section.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <ChevronRight className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground leading-relaxed">{b}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setSummary(null); setInputText(''); setUploadFile(null) }}
              className="mt-8 w-full py-3 rounded-2xl border border-muted/50 text-muted-foreground text-sm font-bold hover:bg-muted/20 transition-colors"
            >
              Clear &amp; Start Over
            </button>
          </div>

        ) : (
          /* Awaiting input */
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
