'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, ArrowRight } from 'lucide-react'

type Task = {
  id: string
  title: string
  is_completed: boolean
  created_at: string
  deadline?: string
}

export default function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
      if (data) setTasks(data)
    }
    fetchTasks()
  }, []) // Removed supabase from array to prevent cascade loops

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  const cells = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push(<div key={`empty-${i}`} className="h-32 border border-muted/20 bg-muted/5 opacity-50 p-2"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDateString = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
    
    const dayTasks = tasks.filter(t => t.deadline && new Date(t.deadline).toDateString() === cellDateString)

    cells.push(
      <div key={`day-${day}`} className="h-32 border border-muted/20 bg-card/40 p-2 flex flex-col gap-1 overflow-hidden transition-colors hover:bg-muted/10 relative">
        <span className="text-sm font-bold text-muted-foreground mb-1">{day}</span>
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide">
          {dayTasks.map(task => (
            <button 
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="text-left text-[10px] sm:text-xs font-semibold px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 truncate shadow-sm hover:opacity-80 transition-all"
            >
              • {task.title}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const formatFullDate = (isoString?: string) => {
    if (!isoString) return 'Not set'
    return new Date(isoString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex flex-col w-full bg-card rounded-3xl border border-muted/30 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <CalendarIcon className="text-primary w-6 h-6"/> Timeline
        </h2>
        <div className="flex items-center gap-4 bg-muted/20 border border-muted/50 rounded-xl p-1 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-muted/50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5"/></button>
          <span className="font-bold w-32 text-center text-foreground">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-muted/50 rounded-lg transition-colors"><ChevronRight className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border border-muted/30 rounded-2xl overflow-hidden shadow-sm bg-card">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-3 bg-muted/30 border-b border-muted/30 text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
        {cells}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 animate-in fade-in zoom-in-95 duration-200 p-4">
          <div className="bg-card border border-muted/50 shadow-2xl rounded-3xl p-8 max-w-lg w-full">
            <h3 className="text-2xl font-extrabold mb-6 text-foreground leading-tight break-words">{selectedTask.title}</h3>
            
            <div className="space-y-4 mb-8 bg-muted/10 p-5 rounded-2xl border border-muted/20">
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1">Created At</p>
                  <p className="text-sm font-semibold text-foreground/90">{formatFullDate(selectedTask.created_at)}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <ArrowRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-extrabold text-primary/70 uppercase tracking-widest mb-1">Deadline Date & Time</p>
                  <p className="text-sm font-semibold text-primary">{formatFullDate(selectedTask.deadline)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedTask(null)} 
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-extrabold shadow-md hover:opacity-90 active:scale-95 transition-all"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
