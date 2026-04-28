'use client'

import { useState } from 'react'
import { LayoutGrid, Calendar as CalendarIcon } from 'lucide-react'
import KanbanBoard from '@/components/workspace/KanbanBoard'
import CalendarView from '@/components/workspace/CalendarView'

export default function WorkspacePage() {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto pb-10 scrollbar-hide relative bg-transparent z-0">
      {/* Ambient structural background lighting */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-screen" />

      {/* Header */}
      <div className="flex items-center justify-between mb-10 shrink-0 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">Workspace</h1>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                Organize and track your projects using a visual Kanban board.
              </p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className={`p-3 rounded-2xl transition-all shadow-sm ${isCalendarOpen ? 'bg-primary text-primary-foreground' : 'bg-card/30 border border-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/50'}`}
          title="Toggle Timeline Calendar"
        >
          <CalendarIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Calendar Area */}
      {isCalendarOpen && (
        <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <CalendarView />
        </div>
      )}

      {/* Board */}
      <div className="flex-1 min-h-[400px] relative z-10 w-full overflow-hidden shrink-0 pb-10">
        <KanbanBoard />
      </div>
    </div>
  )
}
