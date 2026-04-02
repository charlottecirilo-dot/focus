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
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useUserStore()
  const supabase = createClient()

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
    if (!user) {
      alert("You are not fully logged in. Please refresh the page.")
      return
    }

    const newNote = {
      user_id: user.id,
      title: 'Untitled Note',
      content: ''
    }
    const { data, error } = await supabase
      .from('notes')
      .insert(newNote)
      .select()
      .single()

    if (error) {
      alert(`Database Error: ${error.message} - Have you run the database.sql setup file?`)
      console.error(error)
    } else if (data) {
      setNotes([data, ...notes])
      setActiveNoteId(data.id)
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
    <div className="flex bg-background h-[calc(100vh-6rem)] rounded-3xl border border-muted/50 overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500">
      {/* Inner Sidebar for Notes */}
      <div className="w-80 bg-muted/10 border-r border-muted/50 flex flex-col shrink-0">
        <div className="p-4 border-b border-muted/50">
           <button 
             onClick={createNewNote}
             className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-sm"
           >
             <Plus className="w-4 h-4" /> New Note
           </button>
           <div className="mt-4 relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search notes..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-3 py-2 bg-background border border-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
             />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">Loading notes...</p>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground mt-8 px-4">
              <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-foreground">No notes found.</p>
              <p className="mt-1 text-xs">Create your first note to get started.</p>
            </div>
          ) : (
             filteredNotes.map(note => (
               <div 
                 key={note.id}
                 onClick={() => setActiveNoteId(note.id)}
                 className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                   activeNoteId === note.id 
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
      <div className="flex-1 bg-card">
        {activeNote ? (
          <NoteEditor 
            key={activeNote.id} 
            note={activeNote} 
            onUpdate={(id, updates) => {
              setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
            }} 
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="font-semibold text-lg text-foreground">Select a note to read or edit</p>
            <p className="text-sm mt-2 max-w-sm text-center">Your work is auto-saved smoothly. You can also use Speech-to-Text directly inside the editor.</p>
          </div>
        )}
      </div>
    </div>
  )
}
