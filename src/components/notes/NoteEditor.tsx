'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Save, Check, Globe, History, ChevronDown, ChevronUp, PlusCircle, Volume2, AlertCircle, Loader2 } from 'lucide-react'

// Enhanced types for transcription tracking
type TranscriptSession = {
  id: string        // uuid generated client-side (crypto.randomUUID())
  text: string      // the complete final transcript for this session
  language: string  // the recognition.lang value used
  wordCount: number // text.split(' ').filter(Boolean).length
  startedAt: Date   // when recognition.start() was called
}

interface NoteEditorProps {
  note: {
    id: string
    title: string
    content: string
  }
  onUpdate: (id: string, updates: any) => void
}

const LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'fil-PH', name: 'Filipino' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'ja-JP', name: 'Japanese' },
]

export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Enhanced Speech-to-text state
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [transcriptSessions, setTranscriptSessions] = useState<TranscriptSession[]>([])
  const [currentSession, setCurrentSession] = useState<TranscriptSession | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState(false)

  // Stable refs for queue processing
  const currentSessionRef = useRef<TranscriptSession | null>(null)
  useEffect(() => { currentSessionRef.current = currentSession }, [currentSession])

  const titleRef = useRef(title)
  useEffect(() => { titleRef.current = title }, [title])

  const langRef = useRef(selectedLanguage)
  useEffect(() => { langRef.current = selectedLanguage }, [selectedLanguage])

  // Translation Queue
  const translationQueue = useRef<string[]>([])
  const isProcessingQueue = useRef(false)

  const processQueue = async () => {
    if (isProcessingQueue.current) return
    isProcessingQueue.current = true

    while (translationQueue.current.length > 0) {
      const textToSafelyProcess = translationQueue.current[0]
      setIsTranslating(true)
      setTranslationError(false)

      let finalChunk = textToSafelyProcess

      try {
        // Format ISO mappings for MyMemory (it prefers simple codes)
        const formatLang = (code: string) => {
          if (code === 'fil-PH') return 'tl' // Tagalog reference
          if (code === 'ja-JP') return 'ja'
          if (code === 'es-ES') return 'es'
          if (code.startsWith('en')) return 'en'
          return code.split('-')[0]
        }

        const targetLangCode = formatLang(langRef.current)

        // Step 2 & 3: Send to MyMemory with Autodetect source
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToSafelyProcess)}&langpair=Autodetect|${targetLangCode}`
        const res = await fetch(url)

        if (!res.ok) throw new Error('Translation API failed')

        const data = await res.json()

        if (data && data.responseData && data.responseData.translatedText) {
          const translatedText = data.responseData.translatedText

          // Skip substitution if it threw an error string payload back
          if (translatedText.includes('MYMEMORY WARNING:')) {
            throw new Error('API Rate Limit')
          }

          finalChunk = translatedText
        } else {
          throw new Error('Invalid translation payload')
        }
      } catch (err) {
        console.error('Translation queue error:', err)
        setTranslationError(true)
        // Step 5: Fallback is to leave finalChunk as the original textToSafelyProcess
      }

      try {
        // Step 4: Append final translated (or original) text immediately into note
        const currentContent = contentRef.current?.innerText || ''
        const newContent = currentContent.trim() ? currentContent.trim() + ' ' + finalChunk.trim() : finalChunk.trim()

        if (contentRef.current) {
          contentRef.current.innerText = newContent
        }

        setContent(newContent)
        scheduleSave(titleRef.current, newContent)

        // Track in current session
        if (currentSessionRef.current) {
          const updatedText = (currentSessionRef.current.text + ' ' + finalChunk).trim()
          setCurrentSession({
            ...currentSessionRef.current,
            text: updatedText,
            wordCount: updatedText.split(/\s+/).filter(Boolean).length
          })
        }
      } catch (e) {
        console.error("Save error", e)
      } finally {
        translationQueue.current.shift()
      }
    }

    setIsTranslating(false)
    isProcessingQueue.current = false
  }

  const supabase = createClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [recognition, setRecognition] = useState<any>(null) // Browser SpeechRecognition is untyped

  // Browser STT Compatibility Check
  const isSpeechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  }, [])

  // Initialize content on mount or when note changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerText = note.content || ''
    }
    setContent(note.content || '')
    setTitle(note.title)
    setLastSaved(null)
  }, [note.id])


  // Load transcription history on mount
  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('transcription_sessions')
        .select('*')
        .eq('note_id', note.id)
        .order('created_at', { ascending: false })

      if (data) {
        // Map DB record to TranscriptSession type
        const mappedSessions: TranscriptSession[] = data.map((s: any) => ({
          id: s.id,
          text: s.transcript,
          language: s.language,
          wordCount: s.word_count,
          startedAt: new Date(s.created_at)
        }))
        setTranscriptSessions(mappedSessions)
      }
    }
    fetchSessions()
  }, [note.id, supabase])

  // Configure Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = selectedLanguage

      rec.onresult = (event: any) => { // SpeechRecognitionEvent is untyped
        let finalTranscript = ''
        let currentInterim = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            currentInterim += transcript
          }
        }

        setInterimText(currentInterim)

        if (finalTranscript) {
          // Push final text to the translation & insertion queue
          translationQueue.current.push(finalTranscript)
          processQueue()
        }
      }

      rec.onend = async () => {
        setIsRecording(false)
        setInterimText('')

        // Wait for any pending translations to finish, then save the session
        const flushInterval = setInterval(async () => {
          if (!isProcessingQueue.current) {
            clearInterval(flushInterval)
            const prev = currentSessionRef.current

            if (prev && prev.text.trim()) {
              const duration = Math.round((Date.now() - prev.startedAt.getTime()) / 1000)
              const { data: dbData, error } = await supabase
                .from('transcription_sessions')
                .insert({
                  user_id: (await supabase.auth.getUser()).data.user?.id,
                  note_id: note.id,
                  transcript: prev.text,
                  language: prev.language,
                  word_count: prev.wordCount,
                  duration_seconds: duration,
                })
                .select()
                .single()

              if (!error && dbData) {
                const newHistorySession: TranscriptSession = {
                  id: dbData.id,
                  text: dbData.transcript,
                  language: dbData.language,
                  wordCount: dbData.word_count,
                  startedAt: new Date(dbData.created_at)
                }
                setTranscriptSessions(history => [newHistorySession, ...history])
              }
            }
            setCurrentSession(null)
          }
        }, 500)
      }

      rec.onerror = (event: any) => { // SpeechRecognitionErrorEvent is untyped
        setIsRecording(false)
        const errorMap: Record<string, string> = {
          'not-allowed': "Microphone access was denied. Please allow microphone permissions in your browser settings.",
          'audio-capture': "No microphone was found. Please connect a microphone and try again.",
          'no-speech': "No speech was detected. Please try speaking again.",
          'network': "A network error occurred. Please check your connection."
        }
        const message = errorMap[event.error] || "Speech recognition failed. Please try again or use Google Chrome."

        setErrorMessage(message)
        setTimeout(() => setErrorMessage(null), 5000)
      }

      setRecognition(rec)
    }
  }, [selectedLanguage, title, note.id, supabase])

  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) recognition.stop()
    } else {
      if (!recognition) return
      setErrorMessage(null)
      setInterimText('')

      const newSession: TranscriptSession = {
        id: crypto.randomUUID(),
        text: '',
        language: selectedLanguage,
        wordCount: 0,
        startedAt: new Date()
      }

      setCurrentSession(newSession)
      recognition.lang = selectedLanguage
      recognition.start()
      setIsRecording(true)
    }
  }

  const scheduleSave = useCallback((newTitle: string, newContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setSaving(true)
    saveTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('notes')
        .update({ title: newTitle, content: newContent })
        .eq('id', note.id)

      if (!error) {
        setLastSaved(new Date())
        onUpdate(note.id, { title: newTitle, content: newContent })
      }
      setSaving(false)
    }, 1200)
  }, [note.id, supabase, onUpdate])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave(e.target.value, content)
  }

  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerText
    setContent(newContent)
    scheduleSave(title, newContent)
  }

  const reinsertTranscript = (text: string) => {
    const newContent = content.trim() + '\n\n' + text
    setContent(newContent)
    if (contentRef.current) {
      contentRef.current.innerText = newContent
    }
    scheduleSave(title, newContent)
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-r-3xl animate-in fade-in duration-300 relative overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col border-b border-muted/30">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-sm text-muted-foreground">
              {saving ? (
                <span className="flex items-center gap-1.5 font-medium"><Save className="w-4 h-4 animate-pulse" /> Auto-saving...</span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1.5 font-medium"><Check className="w-4 h-4 text-emerald-500" /> Saved</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step 5: Update the word count display to reflect the total note body */}
            {(content.trim().length > 0) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-black text-accent-foreground uppercase tracking-widest">
                  {content.trim().split(/\s+/).length} Words
                </span>
              </div>
            )}

            {translationError && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200 animate-in fade-in zoom-in-95" title="Showing your original spoken text.">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-[10px] font-black text-red-600 tracking-widest">Translation unavailable, showing original text</span>
              </div>
            )}

            {isTranslating && !translationError && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200 animate-in fade-in zoom-in-95">
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Translating</span>
              </div>
            )}

            {!isRecording && isSpeechSupported && (
              <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-muted/30">
                <Globe className="w-4 h-4 text-muted-foreground ml-2" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none pr-2 py-1 appearance-none cursor-pointer"
                >
                  <option value="en-US" className="text-black text-[15px] py-1 px-2">English (US)</option>
                  <option value="en-GB" className="text-black text-[15px] py-1 px-2">English (UK)</option>
                  <option value="fil-PH" className="text-black text-[15px] py-1 px-2">Filipino</option>
                  <option value="es-ES" className="text-black text-[15px] py-1 px-2">Spanish</option>
                  <option value="ja-JP" className="text-black text-[15px] py-1 px-2">Japanese</option>
                </select>
              </div>
            )}

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2.5 rounded-xl transition-all ${showHistory ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
              title="Transcription History"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={toggleRecording}
              disabled={!isSpeechSupported}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isRecording
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:grayscale'
                }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? 'Stop Session' : 'Dictate'}
            </button>
          </div>
        </div>

        {/* Browser Support Banner */}
        {!isSpeechSupported && (
          <div className="mx-6 mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">Speech recognition is not available in your browser. Try Google Chrome or Microsoft Edge for the best experience.</p>
          </div>
        )}

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="mx-6 mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Main Editor Content */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full scrollbar-hide">
          {/* Interim Preview Bar */}
          {isRecording && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-primary animate-bounce" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Listening Live...</span>
              </div>
              <p className="text-foreground/60 italic text-base leading-relaxed">
                {interimText || 'Start speaking to see live transcription...'}
              </p>
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Document Title"
            className="w-full text-4xl font-extrabold text-foreground bg-transparent border-none focus:outline-none mb-8 placeholder:text-muted-foreground/30"
          />

          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            className="w-full min-h-[500px] text-lg leading-loose text-foreground/90 focus:outline-none focus:ring-0 whitespace-pre-wrap pb-32"
          />


          {content.length === 0 && !isRecording && (
            <div className="pointer-events-none absolute top-48 text-muted-foreground/40 text-lg italic">
              Type something, or click &quot;Dictate&quot; to transform your voice into notes...
            </div>
          )}
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="w-64 lg:w-80 border-l border-muted/50 bg-background/80 backdrop-blur-xl flex flex-col shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] animate-in slide-in-from-right duration-300 z-10">
            <div className="p-6 border-b border-muted/30 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Past Sessions
              </h4>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground">{transcriptSessions.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {transcriptSessions.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-muted-foreground font-medium">No transcription sessions recorded for this note yet.</p>
                </div>
              ) : (
                transcriptSessions.map((session) => (
                  <div key={session.id} className="bg-card border border-muted/30 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground">{session.startedAt.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">{session.language}</span>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-3 mb-3 leading-relaxed">
                      {session.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground font-bold uppercase">{session.wordCount} words</span>
                      <button
                        onClick={() => reinsertTranscript(session.text)}
                        className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline underline-offset-2"
                      >
                        <PlusCircle className="w-3 h-3" /> Re-insert
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

