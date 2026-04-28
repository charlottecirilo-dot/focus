'use client'

import { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import KanbanCard, { KanbanTask } from '@/components/workspace/KanbanCard'

interface KanbanColumn {
  id: string
  title: string
  color: string
  tasks: KanbanTask[]
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<{ task: KanbanTask; fromColumnId: string } | null>(null)
  const supabase = createClient()

  // Fetch real data from Supabase on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch notes, flashcards, and tasks in parallel
      const [notesRes, flashcardsRes, tasksRes] = await Promise.all([
        supabase.from('notes').select('*').order('updated_at', { ascending: false }).limit(20),
        supabase.from('flashcards').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      // Transform notes into KanbanTask cards
      const noteCards: KanbanTask[] = (notesRes.data || []).map(note => ({
        id: `note-${note.id}`,
        category: 'Note',
        title: note.title || 'Untitled Note',
        subtitle: note.content ? note.content.replace(/<[^>]*>/g, '').slice(0, 80) : undefined,
        date: new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: 'note' as const,
      }))

      // Transform flashcards into KanbanTask cards
      const flashcardCards: KanbanTask[] = (flashcardsRes.data || []).map(card => ({
        id: `fc-${card.id}`,
        category: 'Flashcard',
        title: card.front,
        subtitle: card.back,
        date: new Date(card.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: 'flashcard' as const,
      }))

      // Transform tasks into KanbanTask cards
      const taskCards: KanbanTask[] = (tasksRes.data || []).map(task => ({
        id: `task-${task.id}`,
        category: task.is_completed ? 'Done' : 'Pending',
        title: task.title,
        date: new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: 'task' as const,
        isCompleted: task.is_completed,
      }))

      setColumns([
        {
          id: 'notes',
          title: 'Notes & Speech',
          color: 'bg-primary/20 text-primary-foreground',
          tasks: noteCards,
        },
        {
          id: 'study',
          title: 'Study Tools',
          color: 'bg-accent/20 text-accent-foreground',
          tasks: flashcardCards,
        },
        {
          id: 'checklist',
          title: 'Checklist',
          color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
          tasks: taskCards,
        },
      ])

      setLoading(false)
    }

    fetchData()
  }, [])

  // --- Drag & Drop Handlers ---
  const handleDragStart = (task: KanbanTask, columnId: string) => {
    setDraggedTask({ task, fromColumnId: columnId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return
    if (draggedTask.fromColumnId === targetColumnId) {
      setDraggedTask(null)
      return
    }

    setColumns(prev =>
      prev.map(col => {
        if (col.id === draggedTask.fromColumnId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) }
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, draggedTask.task] }
        }
        return col
      })
    )
    setDraggedTask(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading workspace data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 scrollbar-hide">
      {columns.map(column => (
        <div
          key={column.id}
          className="flex flex-col min-w-[320px] w-[320px] shrink-0"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-base text-foreground tracking-tight">{column.title}</h3>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg ${column.color}`}>
                {column.tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column Body */}
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
            {column.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-card/60 rounded-[2rem] border border-muted/50 text-center p-6 group transition-all duration-300 hover:border-primary/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <FileText className="w-10 h-10 text-muted-foreground/30 mb-4 group-hover:-translate-y-1 transition-transform group-hover:text-primary/70 relative z-10" />
                <p className="text-sm text-foreground font-extrabold mb-1 relative z-10 tracking-tight">
                  No items yet
                </p>
                <p className="text-[11px] text-muted-foreground/80 font-semibold relative z-10">
                  Create items from their respective pages
                </p>
              </div>
            ) : (
              column.tasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task, column.id)}
                  className="transition-opacity duration-200"
                >
                  <KanbanCard task={task} />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
