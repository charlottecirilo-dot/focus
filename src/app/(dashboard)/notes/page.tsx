'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { Plus, Trash2, FileText, Search } from 'lucide-react'
import NoteEditor from '@/components/notes/NoteEditor'

type Note = {
  id: string
  title: string
  content: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useUserStore()
  const [supabase] = useState(() => createClient())

  // Fetch all notes when the user is populated
  useEffect(() => {
    if (!user) return
    fetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setNotes(data)
    }
    setLoading(false)
  }

  // Create a brand new note document inside Supabase
  const createNewNote = async () => {
    console.log('DEBUG: New Note button clicked!')
    setCreating(true)
    try {
      console.log('DEBUG: Fetching user from Supabase auth...')
      // 1. Fetch user directly from authentic source to bypass any state lagging 
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser()

      if (authErr || !authUser) {
        console.error('DEBUG: Auth error or no user:', authErr)
        alert("You are not authenticated securely. Please log out and back in.")
        return
      }
      
      console.log('DEBUG: Authenticated fully as:', authUser.id)

      const newNote = {
        user_id: authUser.id,
        title: '',
        content: ''
      }

      console.log('DEBUG: Attempting to insert note:', newNote)

      const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select()
        .single()

      if (error) {
        console.error('DEBUG: Supabase notes insert failed with error:', error)
        alert(`Could not create note: ${error.message}`)
      } else if (data) {
        console.log('DEBUG: Supabase notes insert success! Data received:', data)
        setNotes(prev => [data, ...prev])
        setActiveNoteId(data.id)
      }
    } catch (unexpectedError) {
      console.error('DEBUG: Unexpected catch block error:', unexpectedError)
    } finally {
      console.log('DEBUG: setCreating(false) executed.')
      setCreating(false)
    }
  }

  // Delete note from database and locally update state
  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) {
      setNotes(notes.filter(n => n.id !== id))
      if (activeNoteId === id) setActiveNoteId(null)
    }
  }

  const activeNote = notes.find(n => n.id === activeNoteId)

  // Filter notes based on the search term locally
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex bg-card/60 h-[calc(100vh-8rem)] min-h-[500px] rounded-[2.5rem] border border-muted/50 overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-500 isolation-auto relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 mix-blend-screen" />
      {/* Inner Sidebar for Notes */}
      <div className="w-64 md:w-80 bg-background/50 border-r border-muted/50 flex flex-col shrink-0 z-10 transition-all relative">
        <div className="p-5 border-b border-muted/50">
          <button
            onClick={createNewNote}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground py-3 rounded-2xl font-black hover:opacity-90 hover:shadow-[0_8px_20px_rgba(var(--primary),0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {creating ? 'Creating...' : 'New Note'}
          </button>
          <div className="mt-5 relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card/60 border border-muted/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all hover:bg-card shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <p className="text-center text-sm font-bold text-muted-foreground mt-4 animate-pulse">Loading notes...</p>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 bg-card/40 rounded-2xl border border-muted/50 text-center p-4 m-3 group hover:border-primary/30 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner relative z-10 group-hover:scale-110 transition-transform">
                <FileText className="w-4 h-4 text-primary/70" />
              </div>
              <p className="font-extrabold text-foreground relative z-10">No notes found.</p>
              <p className="mt-1 text-[11px] text-muted-foreground font-medium relative z-10">Create your first note to get started.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${activeNoteId === note.id
                    ? 'bg-accent/20 border border-accent/30 shadow-sm'
                    : 'hover:bg-muted/50 border border-transparent'
                  }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className={`font-medium text-sm truncate ${activeNoteId === note.id ? 'text-foreground' : 'text-foreground/80'}`}>
                    {note.title || 'Untitled Note'}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteNote(note.id, e)}
                  className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor Space */}
      <div className="flex-1 flex flex-col bg-transparent min-w-0 relative">
        {activeNote ? (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onUpdate={(id, updates) => {
              setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">

            <div className="w-32 h-32 rounded-[2.5rem] bg-card border border-muted/50 shadow-sm flex items-center justify-center mb-8 relative z-10 group-hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[2.5rem]" />
              <FileText className="w-12 h-12 text-primary/40 relative z-10 drop-shadow-sm" />
            </div>

            <h3 className="font-extrabold text-foreground text-3xl mb-3 tracking-tight relative z-10">Select a note to read or edit</h3>
            <p className="text-lg text-muted-foreground font-medium max-w-sm leading-relaxed relative z-10">
              Your work is auto-saved smoothly. You can also use Speech-to-Text directly inside the editor.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
