'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, Save, Check } from 'lucide-react'

// Basic layout contract for notes editor component
interface NoteEditorProps {
  note: {
    id: string
    title: string
    content: string
  }
  onUpdate: (id: string, updates: any) => void
}

export default function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Speech-to-text recording state flag
  const [isRecording, setIsRecording] = useState(false)
  
  const supabase = createClient()
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [recognition, setRecognition] = useState<any>(null)

  // Configure Web Speech API (Browser compatible)
  useEffect(() => {
    // Standard and Webkit prefixes handled
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true // continue listening
      rec.interimResults = true
      
      rec.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        
        // Append transcribed text directly into our editor state
        if (finalTranscript) {
          const newContent = contentRef.current?.innerText ? contentRef.current.innerText + ' ' + finalTranscript : finalTranscript
          
          if (contentRef.current) {
             contentRef.current.innerText = newContent
          }
          setContent(newContent)
          scheduleSave(title, newContent)
        }
      }
      
      rec.onend = () => {
        setIsRecording(false) // Handle graceful shutdown or microphone failure
      }
      
      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please check your browser permissions.')
        } else if (event.error !== 'no-speech') {
          alert(`Microphone error: ${event.error}. Try using Google Chrome.`)
        }
      }
      
      setRecognition(rec)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle mic handler to trigger Speech API
  const toggleRecording = () => {
    if (!recognition) {
       alert('Your browse does not support Speech Recognition. Try Google Chrome or Microsoft Edge.')
       return
    }
    
    try {
      if (isRecording) {
        recognition.stop()
        setIsRecording(false)
      } else {
        recognition.start()
        setIsRecording(true)
      }
    } catch (err: any) {
      alert(`Speech API failed to start: ${err.message}`)
      setIsRecording(false)
    }
  }

  // Uses debouncing to push changes up to Supabase auto-saving the document silently
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
    }, 1200) // Delay auto-save by 1.2s to reduce excessive network requests
  }, [note.id, supabase, onUpdate])

  // Track the title modifications
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    scheduleSave(e.target.value, content)
  }

  // Track the paragraph block content modifications
  const handleContentInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerText
    setContent(newContent)
    scheduleSave(title, newContent)
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-r-3xl animate-in fade-in duration-300">
      
      {/* Top Banner Toolbar */}
      <div className="flex items-center justify-between p-6 border-b border-muted/30">
        <div className="flex gap-4 text-sm text-muted-foreground mr-4">
          {saving ? (
            <span className="flex items-center gap-1.5 font-medium"><Save className="w-4 h-4 animate-pulse" /> Auto-saving...</span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1.5 font-medium"><Check className="w-4 h-4 text-emerald-500" /> Saved</span>
          ) : null}
        </div>
        
        {/* Magic Speech button */}
        <button 
          onClick={toggleRecording}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            isRecording 
              ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' 
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isRecording ? 'Stop Dictating' : 'Dictate Speech'}
        </button>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full">
        {/* Title Block */}
        <input 
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Document Title"
          className="w-full text-4xl font-extrabold text-foreground bg-transparent border-none focus:outline-none mb-8 placeholder:text-muted-foreground/30"
        />
        
        {/* 
          This is a simulated basic Notion-style editor block focusing on simple text
          Extending it to support Markdown nodes natively is out of scope for the simple request, 
          so it relies on the Browser's 'contentEditable' HTML interface to collect text logic.
        */}
        <div 
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          className="w-full min-h-[500px] text-lg leading-loose text-foreground/90 focus:outline-none focus:ring-0 whitespace-pre-wrap pb-32"
          dangerouslySetInnerHTML={{ __html: note.content || '' }} /* Empty state fallback */
        />
        
        {content.length === 0 && (
           <div className="pointer-events-none absolute mt-[-550px] text-muted-foreground/40 text-lg">
             Type something, or click &quot;Dictate Speech&quot; to insert text using your voice...
           </div>
        )}
      </div>
    </div>
  )
}
