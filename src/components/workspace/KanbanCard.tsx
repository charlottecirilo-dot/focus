'use client'

import { Calendar, Clock, FileText, CheckCircle2, BrainCircuit } from 'lucide-react'

export interface KanbanTask {
  id: string
  category: string
  title: string
  subtitle?: string
  date: string
  icon: 'note' | 'flashcard' | 'task'
  isCompleted?: boolean
}

const iconMap = {
  note: FileText,
  flashcard: BrainCircuit,
  task: CheckCircle2,
}

export default function KanbanCard({ task }: { task: KanbanTask }) {
  const Icon = iconMap[task.icon]

  return (
    <div className={`bg-card rounded-[2rem] border border-muted/50 p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(255,255,255,0.03)] hover:-translate-y-1 transition-all duration-300 group cursor-grab active:cursor-grabbing active:shadow-lg relative overflow-hidden flex flex-col min-h-[160px] ${task.isCompleted ? 'opacity-50' : ''}`}>
      {/* Subtle top gradient accent on card */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Category & Icon Row */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-bold tracking-wide uppercase text-muted-foreground bg-muted/50 px-3 py-1 rounded-lg border border-muted/50 truncate max-w-[200px]">
          {task.category}
        </span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 border-2 border-background shadow-sm flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-foreground/70" />
        </div>
      </div>

      {/* Title */}
      <h4 className={`font-extrabold text-[15px] text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2 drop-shadow-sm ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </h4>

      {/* Subtitle */}
      {task.subtitle && (
        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{task.subtitle}</p>
      )}

      {/* Date */}
      <div className="flex items-center gap-4 text-[11px] font-bold tracking-wide uppercase text-muted-foreground pt-4 mt-auto border-t border-muted/30">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {task.date}
        </span>
      </div>
    </div>
  )
}
