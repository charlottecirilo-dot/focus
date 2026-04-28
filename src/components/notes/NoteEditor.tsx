'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Save, Check, Globe, History, ChevronDown, ChevronUp, PlusCircle, Volume2, AlertCircle, Loader2, Sparkles, FileText } from 'lucide-react'

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
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'fil-PH', name: 'Filipino / Tagalog', flag: '🇵🇭' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
]

export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [supabase] = useState(() => createClient())
  
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Enhanced Speech-to-text state
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('en-US') // Target Language
  const [transcriptSessions, setTranscriptSessions] = useState<TranscriptSession[]>([])
  const [currentSession, setCurrentSession] = useState<TranscriptSession | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [autoTranslate, setAutoTranslate] = useState(true)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)

  // Stable refs for queue processing
  const currentSessionRef = useRef<TranscriptSession | null>(null)
  useEffect(() => { currentSessionRef.current = currentSession }, [currentSession])

  const titleRef = useRef(title)
  useEffect(() => { titleRef.current = title }, [title])

  const targetLangRef = useRef(selectedLanguage)
  useEffect(() => { targetLangRef.current = selectedLanguage }, [selectedLanguage])

  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [recognition, setRecognition] = useState<any>(null) // Browser SpeechRecognition is untyped

  // Translation Queue
  const translationQueue = useRef<string[]>([])
  const isProcessingQueue = useRef(false)

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

  const processQueue = async () => {
    if (isProcessingQueue.current) return
    isProcessingQueue.current = true

    while (translationQueue.current.length > 0) {
      const textToSafelyProcess = translationQueue.current[0]
      setIsTranslating(true)

      let finalChunk = textToSafelyProcess

      if (autoTranslate) {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: textToSafelyProcess,
              targetLanguage: targetLangRef.current,
              sourceLanguage: 'autodetect'
            })
          })

          if (res.ok) {
            const data = await res.json()
            if (data?.translatedText) {
              finalChunk = data.translatedText
            }
          }
        } catch (err) {
          console.error('Translation queue error:', err)
        }
      }

      try {
        const currentContent = contentRef.current?.innerText || ''
        const newContent = currentContent.trim() ? currentContent.trim() + ' ' + finalChunk.trim() : finalChunk.trim()

        if (contentRef.current) {
          contentRef.current.innerText = newContent
        }

        setContent(newContent)
        scheduleSave(titleRef.current, newContent)

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
  }, [note.id])

  // Configure Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      // Leave lang unset so the browser auto-detects the spoken language
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
              const { data: { user: authUser } } = await supabase.auth.getUser()
              if (!authUser) return

              const { data: dbData, error } = await supabase
                .from('transcription_sessions')
                .insert({
                  user_id: authUser.id,
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

      rec.onerror = (event: any) => {
        setIsRecording(false)
        const errorMap: Record<string, string> = {
          'not-allowed': "Microphone access denied.",
          'audio-capture': "Microphone not found.",
          'no-speech': "No speech detected.",
          'network': "Network error."
        }
        setErrorMessage(errorMap[event.error] || "Recognition failed.")
        setTimeout(() => setErrorMessage(null), 3000)
      }

      setRecognition(rec)
    }
  }, [note.id, supabase])


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
        language: 'auto',
        wordCount: 0,
        startedAt: new Date()
      }

      setCurrentSession(newSession)
      recognition.start()
      setIsRecording(true)
    }
  }

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
      <div className="flex flex-col border-b border-muted/20 bg-background/50 backdrop-blur-md z-30">
        <div className="flex items-center justify-between px-8 py-5">

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] leading-none mb-1">Editor Session</span>
                {saving ? (
                  <span className="text-xs font-bold text-foreground/60 flex items-center gap-1.5 animate-pulse">
                    <Save className="w-3 h-3" /> Syncing...
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> System Ready
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Translation Center */}
            <div className="flex items-center bg-muted/30 p-1 rounded-[1.25rem] border border-muted/30 shadow-inner">
              <button
                onClick={() => setAutoTranslate(!autoTranslate)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-[11px] font-black tracking-widest uppercase ${autoTranslate
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-background/40'
                  }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${autoTranslate ? 'animate-sparkle' : ''}`} />
                {autoTranslate ? 'AI TRANSLATE ON' : 'Translator Off'}
              </button>

              <div className="relative ml-1">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-[11px] font-black tracking-widest uppercase ${showLanguageDropdown ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-background/40'
                    }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'Select Language'}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showLanguageDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageDropdown(false)}
                    />
                    <div className="absolute top-full mt-3 right-0 w-64 bg-background border border-muted/50 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <p className="px-3 py-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-muted/20 mb-1">Target Language</p>
                      <div className="max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang.code)
                              setShowLanguageDropdown(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${selectedLanguage === lang.code
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/50 text-foreground/70'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-base leading-none">{lang.flag}</span>
                              <span>{lang.name}</span>
                            </div>
                            {selectedLanguage === lang.code && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-8 bg-muted/40 mx-2" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-3 rounded-xl transition-all duration-200 ${showHistory
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                title="Session History"
              >
                <History className="w-5 h-5" />
              </button>

              <button
                onClick={toggleRecording}
                disabled={!isSpeechSupported}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-sm relative overflow-hidden group ${isRecording
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/20'
                    : 'bg-foreground text-background hover:scale-[1.02] active:scale-[0.98]'
                  } disabled:opacity-30 disabled:pointer-events-none`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Listening' : 'Start Dictate'}
              </button>
            </div>

          </div>
        </div>

        {/* Dynamic Feedback Banners */}
        <div className="flex items-center gap-4 px-8 pb-4">
          {isTranslating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-in slide-in-from-top-2">
              <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">AI Polishing & Translating</span>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-top-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
              <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">Voice Active</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2 opacity-40">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{content.trim().split(/\s+/).filter(Boolean).length} Words</span>
          </div>
        </div>

        {!isSpeechSupported && (
          <div className="mx-8 mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">Browser doesn&apos;t support dictation. Try Google Chrome.</p>
          </div>
        )}
        {errorMessage && (
          <div className="mx-8 mb-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in slide-in-from-top-2">
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

          {/* Document Title — block-level to prevent inline collapse */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Document Title"
            className="block w-full text-4xl font-extrabold text-foreground bg-transparent border-none focus:outline-none mb-6 placeholder:text-muted-foreground/30"
          />

          {/* Horizontal rule separator */}
          <hr className="border-muted/20 mb-6" />

          {/* Body content area */}
          <div className="relative">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleContentInput}
              className="w-full min-h-[400px] text-lg leading-loose text-foreground/90 focus:outline-none focus:ring-0 whitespace-pre-wrap pb-32"
            />
            {content.length === 0 && !isRecording && (
              <p className="pointer-events-none absolute top-0 left-0 text-muted-foreground/40 text-lg italic select-none">
                Type something, or click &quot;Dictate&quot; to transform your voice into notes...
              </p>
            )}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="w-64 lg:w-80 border-l border-muted/50 bg-background flex flex-col shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] animate-in slide-in-from-right duration-300 z-10">
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

